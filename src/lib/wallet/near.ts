// wallet setup is copied from near-wallet-selector example
import { providers } from 'near-api-js'

// wallet selector
import { distinctUntilChanged, map } from 'rxjs'
import '@near-wallet-selector/modal-ui/styles.css'
import { setupModal } from '@near-wallet-selector/modal-ui'
import {
  Network,
  NetworkId,
  WalletSelector,
  setupWalletSelector,
} from '@near-wallet-selector/core'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { NEAR_CONTRACT_ID } from '@/config'

export class NearWallet {
  private _selector?: Promise<WalletSelector>

  /**
   * @constructor
   * const wallet = new Wallet({ networkId: 'testnet', createAccessKeyFor: 'contractId' });
   * wallet.startUp((signedAccountId) => console.log(signedAccountId));
   */
  constructor(
    readonly networkId: Network | NetworkId = 'testnet',
    readonly createAccessKeyFor: string = NEAR_CONTRACT_ID,
  ) {}

  /**
   * To be called when the website loads
   */
  async startUp(accountChangeHook: (accountId?: string) => unknown) {
    this._selector = setupWalletSelector({
      network: this.networkId,
      modules: [setupMyNearWallet()],
    })

    const walletSelector = await this.selector
    const isSignedIn = walletSelector.isSignedIn()
    const accountId = isSignedIn
      ? walletSelector.store.getState().accounts[0].accountId
      : ''

    walletSelector.store.observable
      .pipe(
        map(state => state.accounts),
        distinctUntilChanged(),
      )
      .subscribe(accounts => {
        const signedAccount = accounts.find(
          account => account.active,
        )?.accountId
        accountChangeHook(signedAccount)
      })

    return accountId
  }

  get selector() {
    if (!this._selector) throw new Error('Wallet not initialized')
    return this._selector
  }

  /**
   * Displays a modal to login the user
   */
  signIn = async () => {
    const modal = setupModal(await this.selector, {
      contractId: this.createAccessKeyFor,
    })
    modal.show()
  }

  /**
   * Logout the user
   */
  signOut = async () => {
    const selectedWallet = await (await this.selector).wallet()
    selectedWallet.signOut()
  }

  //   viewMethod = async ({ contractId, method, args = {} }) => {
  //     const url = `https://rpc.${this.networkId}.near.org`
  //     const provider = new providers.JsonRpcProvider({ url })

  //     let res = await provider.query({
  //       request_type: 'call_function',
  //       account_id: contractId,
  //       method_name: method,
  //       args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
  //       finality: 'optimistic',
  //     })
  //     return JSON.parse(Buffer.from(res.result).toString())
  //   }

  //   /**
  //    * Makes a call to a contract
  //    * @param {Object} options - the options for the call
  //    * @param {string} options.contractId - the contract's account id
  //    * @param {string} options.method - the method to call
  //    * @param {Object} options.args - the arguments to pass to the method
  //    * @param {string} options.gas - the amount of gas to use
  //    * @param {string} options.deposit - the amount of yoctoNEAR to deposit
  //    * @returns {Promise<Transaction>} - the resulting transaction
  //    */
  //   callMethod = async ({
  //     contractId,
  //     method,
  //     args = {},
  //     gas = THIRTY_TGAS,
  //     deposit = NO_DEPOSIT,
  //   }) => {
  //     // Sign a transaction with the "FunctionCall" action
  //     const selectedWallet = await (await this.selector).wallet()
  //     const outcome = await selectedWallet.signAndSendTransaction({
  //       receiverId: contractId,
  //       actions: [
  //         {
  //           type: 'FunctionCall',
  //           params: {
  //             methodName: method,
  //             args,
  //             gas,
  //             deposit,
  //           },
  //         },
  //       ],
  //     })

  //     if (!outcome) {
  //       throw new Error('No outcome returned')
  //     }

  //     return providers.getTransactionLastResult(outcome)
  //   }

  /**
   * Makes a call to a contract
   * @param {string} txhash - the transaction hash
   * @returns {Promise<JSON.value>} - the result of the transaction
   */
  getTransactionResult = async (txhash: string) => {
    const walletSelector = await this.selector
    const { network } = walletSelector.options
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl })

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused')
    return providers.getTransactionLastResult(transaction)
  }
}
