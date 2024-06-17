import BN from 'bn.js'
import { NearWallet } from '@/lib/wallet/near'
import {
  BlockchainAdapter,
  FooContract,
  GetTokenBalanceInput,
} from './interface'
import { Account, Contract } from 'near-api-js'

type ContractWithMethods<
  V extends ReadonlyArray<string> = [],
  C extends ReadonlyArray<string> = [],
> = Contract & {
  [k in V[number]]: <T = any>(...args: any[]) => Promise<T>
} & {
  [k in C[number]]: <T = any>(...args: any[]) => Promise<T>
}

const viewMethods = ['list_foo']
const changeMethods = ['add_foo']

type NearFooContract = ContractWithMethods<
  typeof viewMethods,
  typeof changeMethods
>

export function getContract(account: Account, contractId: string) {
  return new Contract(account, contractId, {
    viewMethods: viewMethods as unknown as string[],
    changeMethods: changeMethods as unknown as string[],
    useLocalViewExecution: true,
  }) as NearFooContract
}

export class NearChainAdapter implements BlockchainAdapter, FooContract {
  constructor(readonly wallet: NearWallet) {}

  getBlockHash(height: number): Promise<string> {
    throw new Error('Method not implemented.')
  }

  getBlockHeight(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async signIn(): Promise<void> {
    return this.wallet.signIn()
  }

  async signOut(): Promise<void> {
    return this.wallet.signOut()
  }

  async getTokenBalance(input: GetTokenBalanceInput): Promise<BN> {
    if (input.type === 'native') {
      return new BN(0)
    } else {
      return new BN(0)
    }
  }

  async getFoo(id: string): Promise<string> {
    return 'hello'
  }

  async listFoo(): Promise<string[]> {
    return ['hello']
  }
}
