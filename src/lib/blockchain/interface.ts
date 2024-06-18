import BN from 'bn.js'

export type ChainId = 'near' | 'foo'

export type ExecutionOutcome = {
  status: 'Success' | 'Failure'
  transactionHash: string
}

export interface SwapInput {
  signerAddress: string
  from: string
  to: string
  // example, not production ready
  inputAmount: number
  slippagePercentage: number
}

export interface BlockchainAdapter {
  // example interface, unimplemented
  getBlockHeight(): Promise<number>
  getBlockHash(height: number): Promise<string>
  getTokenBalance(owner: string, token: string): Promise<BN>

  signIn(): Promise<void>
  signOut(): Promise<void>

  swap(input: SwapInput): Promise<ExecutionOutcome>
  estimateSwap(input: SwapInput): Promise<number>
}
