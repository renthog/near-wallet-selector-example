import BN from 'bn.js'
import { NearWallet } from '@/lib/wallet/near'
import { BlockchainAdapter, ExecutionOutcome, SwapInput } from './interface'
import { FunctionCallAction, Transaction } from '@near-wallet-selector/core'
import { FinalExecutionOutcome } from 'near-api-js/lib/providers'
import {
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  getExpectedOutputFromSwapTodos,
  instantSwap,
  Transaction as RefWeirdTransaction,
} from '@ref-finance/ref-sdk'
import { utils } from 'near-api-js'

export const ONE_TGAS = new BN(Math.pow(10, 12))
export const MAX_GAS = tgasAmount(300)

export function tgasAmount(tgas: number) {
  return new BN(tgas).mul(ONE_TGAS)
}

export class NearChainAdapter implements BlockchainAdapter {
  constructor(readonly wallet: NearWallet) {}

  getBlockHash(height: number): Promise<string> {
    throw new Error('Method not implemented.')
  }

  getBlockHeight(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async getTokenBalance(owner: string, token: string): Promise<BN> {
    throw new Error('Method not implemented.')
  }

  async signIn(): Promise<void> {
    return this.wallet.signIn()
  }

  async signOut(): Promise<void> {
    return this.wallet.signOut()
  }

  private async signAndSendTransactions(transactions: Transaction[]) {
    const selector = await this.wallet.selector
    const wallet = await selector.wallet()
    const res = await wallet.signAndSendTransactions({
      transactions,
    })

    if (!res) {
      throw new Error('Transaction failed')
    }

    return extractOutcome(res)
  }

  // create swap route and execute swap (may differ from actual ref frontend
  // implementation, but should be close enough for demo)
  private async demoRefSwap(input: SwapInput, createTransactions = false) {
    const { simplePools } = await fetchAllPools()
    const tokenIn = await ftGetTokenMetadata(input.from)
    const tokenOut = await ftGetTokenMetadata(input.to)

    const swapTodos = await estimateSwap({
      tokenIn,
      tokenOut,
      amountIn: input.inputAmount.toString(), // nominal
      simplePools,
    })

    const amountOut = getExpectedOutputFromSwapTodos(swapTodos, tokenOut.id)

    if (!createTransactions) {
      return { amountOut, transactions: undefined }
    }

    const transactions = await instantSwap({
      tokenIn,
      tokenOut,
      amountIn: input.inputAmount.toString(),
      swapTodos,
      slippageTolerance: 0.01,
      AccountId: input.signerAddress,
    })

    return { amountOut, transactions }
  }

  async swap(input: SwapInput): Promise<ExecutionOutcome> {
    const { transactions } = await this.demoRefSwap(input, true)

    if (!transactions) {
      // likely internal error
      throw new Error('No transactions')
    }

    // transform ref's internal tx format to near-wallet-selector format
    const txs = transformTransactions(transactions, input.signerAddress)
    const res = await this.signAndSendTransactions(txs)

    if (!res) {
      throw new Error('Transaction failed')
    }

    const isFailure =
      (typeof res.outcome.status === 'object' &&
        'Failure' in res.outcome.status) ||
      res.outcome.status === 'Failure'

    return {
      // technically can still be pending. not in scope to handle every case here
      status: isFailure ? 'Failure' : 'Success',
      transactionHash: res.id,
    }
  }

  async estimateSwap(input: SwapInput): Promise<number> {
    const { amountOut } = await this.demoRefSwap(input)
    return Number(amountOut)
  }
}

/**
 * Used to extract txid for explorer url
 */
export function extractOutcome(
  res: FinalExecutionOutcome | FinalExecutionOutcome[],
) {
  if (!('length' in res)) {
    return res.transaction_outcome
  }
  if (res.length) {
    const [lastOutcome] = res.slice(-1)
    return lastOutcome.transaction_outcome
  }
}

// ref sdk has a function called "transformTransactions" to transform their
// internal tx representation to near api js tx representation. However, the
// output type of this function does not match what near wallet selector
// expects, so it's copied here
export const transformTransactions = (
  transactions: RefWeirdTransaction[],
  AccountId: string,
) => {
  const parsedTransactions = transactions.map((t: RefWeirdTransaction) => {
    return {
      signerId: AccountId,
      receiverId: t.receiverId,
      actions: t.functionCalls.map(fc => {
        const action: FunctionCallAction = {
          type: 'FunctionCall',
          params: {
            methodName: fc.methodName,
            args: fc.args || {},
            gas: fc.gas
              ? // notable change: ref sdk uses BN (near-api-js can handle BN)
                // but we need string because near-wallet-selector *can't*
                new BN(fc.gas).toString()
              : tgasAmount(100).toString(),
            deposit: utils.format.parseNearAmount(fc.amount) || '0',
          },
        }

        return action
      }),
    }
  })

  return parsedTransactions
}
