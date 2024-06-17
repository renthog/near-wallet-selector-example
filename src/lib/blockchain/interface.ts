import BN from 'bn.js'

export type BlockchainId = 'near' | 'foo'

export interface FooContract {
  listFoo(): Promise<string[]>
  getFoo(id: string): Promise<string>
}

export type GetTokenBalanceInput =
  | {
      type: 'native'
      forAddress: string
    }
  | {
      type: 'token'
      contractAddress: string
      forAddress: string
    }

export interface BlockchainAdapter {
  getBlockHeight(): Promise<number>
  getBlockHash(height: number): Promise<string>
  getTokenBalance(input: GetTokenBalanceInput): Promise<BN>
  signIn(): Promise<void>
  signOut(): Promise<void>
}
