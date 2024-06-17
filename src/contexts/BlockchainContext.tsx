'use client'
import { BlockchainAdapter } from '@/lib/blockchain/interface'
import { createContext, useContext } from 'react'

export const BlockchainContext = createContext<{
  adapter?: BlockchainAdapter
  connectedAddress?: string
}>({
  adapter: undefined,
  connectedAddress: undefined,
})

export function useBlockchain() {
  return useContext(BlockchainContext)
}
