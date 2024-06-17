'use client'
/** @jsxImportSource @emotion/react */
import 'twin.macro'

import { Button } from '@/components/Button'
import { useEffect, useState } from 'react'
import { BlockchainAdapter, BlockchainId } from '@/lib/blockchain/interface'
import { NEAR_CONTRACT_ID } from '@/config'
import { NearWallet } from '@/lib/wallet/near'
import { BlockchainContext, useBlockchain } from '@/contexts/BlockchainContext'
import { NearChainAdapter } from '@/lib/blockchain/near'

const App = () => {
  // Use this to switch chains. You could provide this in a context.
  const id: BlockchainId = 'near'

  // Create adapter which will be available in context through rest of app
  const [adapter, setAdapter] = useState<BlockchainAdapter>()
  const [connectedAddress, setConnectedAddress] = useState<string>()

  useEffect(() => {
    if (id === 'near') {
      const wallet = new NearWallet('testnet', NEAR_CONTRACT_ID)
      wallet.startUp(setConnectedAddress)
      setAdapter(new NearChainAdapter(wallet))
    } else {
      throw new Error('Unsupported blockchain')
    }
  }, [id])

  return (
    <BlockchainContext.Provider value={{ adapter, connectedAddress }}>
      <main tw="min-h-screen flex flex-col justify-center items-center gap-y-5 bg-gradient-to-tr from-sky-400 to-fuchsia-300">
        <WalletButton />
        <Button isSmall>Close</Button>
      </main>
    </BlockchainContext.Provider>
  )
}

const WalletButton = () => {
  const { connectedAddress, adapter } = useBlockchain()
  const onClick = () => {
    if (!connectedAddress && adapter) {
      adapter.signIn()
    } else if (connectedAddress && adapter) {
      adapter.signOut()
    }
  }

  return (
    <Button variant="primary" onClick={onClick}>
      {connectedAddress ? connectedAddress : 'Connect Wallet'}
    </Button>
  )
}

export default App
