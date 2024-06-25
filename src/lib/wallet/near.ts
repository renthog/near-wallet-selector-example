// wallet setup is copied from near-wallet-selector example
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
import { setupSender } from '@near-wallet-selector/sender'

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
      modules: [setupMyNearWallet(), setupSender()],
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
}
