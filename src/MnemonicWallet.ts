import {RandomHelpers, NumbersHelpers, sleep, log, c, retry, getTxStatus, defaultSleep} from './helpers'
import {erc20_abi} from '../abi/erc20'
import {Wallet, JsonRpcProvider, HDNodeWallet, formatUnits, parseEther, formatEther} from 'ethers'
import {
    Account,
    CallData,
    ec,
    hash,
    constants,
    uint256,
    Contract,
    Call,
    getChecksumAddress,
    RpcProvider,
    LibraryError,
    ContractVersion
} from 'starknet'
import axios, {AxiosInstance} from 'axios'
import * as fs from 'fs'
import {RPC_URLS, explorer, maxFee} from '../config'
import {ActionResult, Token} from './types'
import {claim_abi} from '../abi/claim'
import {STRK} from './tokens'
import {HttpsProxyAgent} from 'https-proxy-agent'
// import data0 from '../proofs/starknet-0.json'
// import data1 from '../proofs/starknet-1.json'
// import data2 from '../proofs/starknet-2.json'
// import data3 from '../proofs/starknet-3.json'
// import data4 from '../proofs/starknet-4.json'
// import data5 from '../proofs/starknet-5.json'
// import data6 from '../proofs/starknet-6.json'
// import data7 from '../proofs/starknet-7.json'
// import data8 from '../proofs/starknet-8.json'
// import data9 from '../proofs/starknet-9.json'
// import data10 from '../proofs/starknet-10.json'

class MnemonicStarknetWallet {
    type = 'seed'
    // init Account here
    mnemonic: string
    index: string
    exchAddress: string | undefined
    claimAddress = '0x06793d9e6ed7182978454c79270e5b14d2655204ba6565ce9b0aa8a3c3121025'
    groundKey: string
    starknetKey: string
    starknetAddress: string
    starknetAccount: Account
    walletCairoVersion: '0' | '1'

    captchaSolution: any = undefined

    starkProvider = new RpcProvider({
        nodeUrl: RandomHelpers.chooseElementFromArray(RPC_URLS)
    })

    accountClassHash = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2'
    argentProxyClassHash = '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918'
    argentClassHash_cairo1 = '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003'
    /**
     *
     * @param mnemonic starknet seed phrase
     * @param evmPrivateKey eth private key
     * @param index
     */
    constructor(mnemonic?: string, index?: string, exchAddress?: string) {
        if (!mnemonic) mnemonic = 'spin garbage trend design rack fork damage laundry bottom tumble pistol grief'
        if (index == undefined) index = '0'
        this.exchAddress = exchAddress ?? undefined
        const signer = Wallet.fromPhrase(mnemonic)
        const masterNode = HDNodeWallet.fromSeed(signer.privateKey)
        const childNode = masterNode.derivePath(`m/44'/9004'/0'/0/${index}`)
        const groundKey = '0x' + ec.starkCurve.grindKey(childNode.privateKey)
        this.groundKey = groundKey
        const publicKey = ec.starkCurve.getStarkKey(groundKey)
        const constructorCallData = CallData.compile({
            implementation: this.accountClassHash,
            selector: hash.getSelectorFromName('initialize'),
            calldata: CallData.compile({
                signer: publicKey,
                guardian: '0'
            })
        })
        let addr = hash.calculateContractAddressFromHash(publicKey, this.argentProxyClassHash, constructorCallData, 0)
        this.mnemonic = mnemonic
        this.index = index
        this.starknetKey = groundKey
        this.starknetAddress = getChecksumAddress(addr)
        this.starknetAccount = new Account(this.starkProvider, addr, groundKey)
        this.walletCairoVersion = '0'
    }
    async init(): Promise<ActionResult> {
        return this.findDeployedAddress(this.mnemonic, this.index)
    }
    async findDeployedAddress(mnemonic: string, index: string): Promise<ActionResult> {
        try {
            const signer = Wallet.fromPhrase(mnemonic)
            const masterNode = HDNodeWallet.fromSeed(signer.privateKey)
            const childNode = masterNode.derivePath(`m/44'/9004'/0'/0/${index}`)
            const groundKey = '0x' + ec.starkCurve.grindKey(childNode.privateKey)
            const publicKey = ec.starkCurve.getStarkKey(groundKey)

            const constructorCallDataCairo0 = CallData.compile({
                implementation: this.accountClassHash,
                selector: hash.getSelectorFromName('initialize'),
                calldata: CallData.compile({
                    signer: publicKey,
                    guardian: '0'
                })
            })
            const constructorCallDataCairo1 = CallData.compile({
                owner: publicKey,
                guardian: '0'
            })
            let cairo0Address = hash.calculateContractAddressFromHash(publicKey, this.argentProxyClassHash, constructorCallDataCairo0, 0)
            let cairo1Address = hash.calculateContractAddressFromHash(publicKey, this.argentClassHash_cairo1, constructorCallDataCairo1, 0)
            cairo0Address = getChecksumAddress(cairo0Address)
            cairo1Address = getChecksumAddress(cairo1Address)

            let isCairo0Deployed: ActionResult = await this.isAccountDeployed(cairo0Address)
            if (isCairo0Deployed.result) {
                this.starknetAddress = cairo0Address
                let version: ContractVersion = await this.starkProvider.getContractVersion(cairo0Address)
                if (version.cairo == undefined) {
                    return {success: true, statusCode: 1, result: false}
                }
                this.starknetAccount = new Account(this.starkProvider, cairo0Address, groundKey, version.cairo)
                this.walletCairoVersion = version.cairo
                return {success: true, statusCode: 1, result: cairo0Address}
            }
            let isCairo1Deployed: ActionResult = await this.isAccountDeployed(cairo1Address)
            if (isCairo1Deployed.result) {
                this.starknetAddress = cairo1Address
                this.starknetAccount = new Account(this.starkProvider, cairo1Address, groundKey, '1')
                this.walletCairoVersion = '1'
                return {success: true, statusCode: 1, result: cairo1Address}
            }
            this.starknetAddress = cairo1Address
            this.starknetAccount = new Account(this.starkProvider, cairo1Address, groundKey, '1')
            return {success: true, statusCode: 1, result: undefined}
        } catch (e: any) {
            this.changeProvider()
            return this.findDeployedAddress(mnemonic, index)
        }
    }
    async isAccountDeployed(address?: string): Promise<ActionResult> {
        if (!address) address = this.starknetAddress
        try {
            let nonce: string = await this.starkProvider.getNonceForAddress(address)
            // log(address, nonce)
            if (nonce != '0x0') {
                return {success: true, statusCode: 1, result: true}
            } else {
                return {success: true, statusCode: 1, result: false}
            }
        } catch (e: any) {
            if (e instanceof LibraryError && e.message.includes('Contract not found')) {
                return {success: true, statusCode: 1, result: false}
            }
            this.changeProvider()
            return {success: false, statusCode: 0, result: false}
        }
    }
    changeProvider(): void {
        this.starkProvider = new RpcProvider({
            nodeUrl: RandomHelpers.chooseElementFromArray(RPC_URLS)
        })
        this.starknetAccount = new Account(this.starkProvider, this.starknetAccount.address, this.starknetKey)
        log(`changed provider`)
    }
    async transfer(token: Token): Promise<ActionResult> {
        if (this.exchAddress == undefined) {
            return {success: true, statusCode: 1, result: 'wanted to send, but no exch address provided'}
        }
        let amount = (await this.getBalance(token))?.result
        while (amount <= 1n) {
            amount = (await this.getBalance(token))?.result
            console.log(`waiting strk to arrive`)
            await defaultSleep(5)
        }
        let tokenContract = new Contract(token.abi, token.address, this.starkProvider)
        let transferCallData = tokenContract.populate('transfer', [this.exchAddress, uint256.bnToUint256(amount)])
        let multicall
        try {
            multicall = await this.starknetAccount.execute([transferCallData], undefined, {maxFee: parseEther(maxFee)})
            log(
                `${this.starknetAddress} transferred ${formatUnits(amount, token.decimals)} ${token.name}:`,
                c.green(explorer + multicall.transaction_hash)
            )
            return await this.retryGetTxStatus(multicall.transaction_hash, 'success!')
        } catch (e: any) {
            console.log(e)
            this.changeProvider()
            return this.transfer(token)
        }
    }
    async getClaimData(): Promise<any> {
        for (let i = 0; i <= 10; i++) {
            let source = fs.readFileSync(`./proofs/starknet-${i}.json`, 'utf-8')
            let data = await JSON.parse(source)
            let len = data.eligibles.length
            for (let j = 0; j < len; j++) {
                // console.log(data.eligibles[j].identity == this.starknetAddress.toLowerCase(), `./proofs/starknet-${i}.json`)
                if (data.eligibles[j].identity == this.starknetAddress.toLowerCase()) {
                    return data.eligibles[j]
                }
            }
        }
        return undefined
    }
    async claim(data: any) {
        try {
            const contract = new Contract(claim_abi, this.claimAddress, this.starknetAccount)
            let hash = await contract.claim(data)
            console.log(c.green(`claimed ${formatEther(data.balance)} STRK ${explorer + hash.transaction_hash}`))
        } catch (e: any) {
            console.log(e.message)
        }
    }
    /**
     * retriable getBalance
     * @param token
     * @returns
     */
    async getBalance(token: Token): Promise<any> {
        let balance: bigint
        try {
            let tokenContract: Contract = new Contract(erc20_abi, token.address, this.starkProvider)
            balance = (await retry(tokenContract.balanceOf, {maxRetries: 3, retryInterval: 1}, this.starknetAddress)).balance.low
            return {success: true, statusCode: 1, result: balance}
        } catch (e) {
            this.changeProvider()
            return this.getBalance(token)
        }
    }
    /**
     * retried getTxStatus
     * @param hash
     * @param pasta
     * @returns
     */
    async retryGetTxStatus(hash: string, pasta: string): Promise<ActionResult> {
        return await retry(getTxStatus, {maxRetries: 20, retryInterval: 5}, this.starknetAccount, hash, pasta)
    }
}

export {MnemonicStarknetWallet}
