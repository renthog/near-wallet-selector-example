'use client'
/** @jsxImportSource @emotion/react */
import 'twin.macro'

import { Button } from '@/components/Button'
import { FormEvent, useEffect, useState } from 'react'
import { BlockchainAdapter, ChainId } from '@/lib/blockchain/interface'
import { NEAR_CONTRACT_ID, SWAP_FROM, SWAP_TO } from '@/config'
import { NearWallet } from '@/lib/wallet/near'
import { BlockchainContext, useBlockchain } from '@/contexts/BlockchainContext'
import { NearChainAdapter } from '@/lib/blockchain/near'
import { init_env as initRefSdk } from '@ref-finance/ref-sdk'

const App = () => {
  // Use this to switch chains. You could provide this in a context.
  const id: ChainId = 'near'

  // Create adapter which will be available in context through rest of app
  const [adapter, setAdapter] = useState<BlockchainAdapter>()
  const [connectedAddress, setConnectedAddress] = useState<string>()

  useEffect(() => {
    if (id === 'near') {
      const wallet = new NearWallet('testnet', NEAR_CONTRACT_ID)
      wallet.startUp(setConnectedAddress)
      setAdapter(new NearChainAdapter(wallet))

      // HACK: ref sdk requires this to set up the library (see docs---not really
      // relevant for the demo)
      initRefSdk('testnet')
    } else {
      throw new Error('Unsupported blockchain')
    }
  }, [id])

  return (
    <BlockchainContext.Provider value={{ adapter, connectedAddress }}>
      <main tw="min-h-screen flex flex-col justify-center items-center gap-y-5 bg-gradient-to-tr from-sky-400 to-fuchsia-300">
        <WalletButton />
        {!!connectedAddress?.length && <SwapForm />}
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

const SwapForm = () => {
  const { connectedAddress, adapter } = useBlockchain()
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (adapter && connectedAddress) {
      adapter
        .estimateSwap({
          from: SWAP_FROM,
          to: SWAP_TO,
          inputAmount: 1,
          signerAddress: connectedAddress,
          slippagePercentage: 0.01,
        })
        .then(amountOut => setAmount(amountOut.toFixed(0)))
    }
  }, [adapter, connectedAddress])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (adapter && connectedAddress) {
      await adapter.swap({
        from: SWAP_FROM,
        to: SWAP_TO,
        inputAmount: 1,
        signerAddress: connectedAddress,
        slippagePercentage: 0.01,
      })
    }
  }

  return (
    <form
      tw="bg-white rounded shadow border border-black p-4 flex flex-col items-stretch gap-4"
      onSubmit={submit}
    >
      <p>Swapping 1 NEAR to USDT.e (testnet)</p>
      <div tw="tabular-nums flex justify-between gap-4">
        <span>In (NEAR)</span> <span>1</span>
      </div>
      <div tw="tabular-nums flex justify-between gap-4">
        <span>Out (USDT.e)</span>
        <span>{amount.length ? `~${amount}` : 'calcuating...'}</span>
      </div>
      <Button variant="primary">Confirm Swap</Button>
    </form>
  )
}

export default App
