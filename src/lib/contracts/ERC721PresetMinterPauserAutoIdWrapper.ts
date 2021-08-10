import Web3 from 'web3';
import * as MyNFTJSON from '../../../build/contracts/ERC721PresetMinterPauserAutoId.json';
import { ERC721PresetMinterPauserAutoId } from '../../types/ERC721PresetMinterPauserAutoId';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class NFTWrapper {
    web3: Web3;

    contract: ERC721PresetMinterPauserAutoId;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(MyNFTJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async mint (toAddress: string, color: string) {
        // const tx = await (this.contract
        //     .methods.mint(color, toAddress)
        //     .send({
        //         ...DEFAULT_SEND_OPTIONS,
        //         from: this.address
        //     } as any) as any);

        // return tx.transactionHash;

        const tx = await this.contract.methods.mint(toAddress, color).send({
            ...DEFAULT_SEND_OPTIONS,
            from: toAddress
        });

        return tx;
    }

    async getOwnColors (fromAddress: string) {
        const n = await this.contract.methods.balanceOf (fromAddress).call ({ from: fromAddress });
        const nNum = parseInt (n, 10);

        const colors = [];
        for (let i = 0; i < nNum; i++) {
            const globalTokenId = await this.contract.methods.tokenOfOwnerByIndex(fromAddress, i).call ({ from: fromAddress });
            const color = await this.contract.methods.tokenColor (parseInt (globalTokenId, 10)).call ({ from: fromAddress });
            if (color.startsWith ("#")) colors.push (color);
        }
        return colors;
    }

    

    // async getStoredValue(fromAddress: string) {
    //     const data = await this.contract.methods.get().call({ from: fromAddress });

    //     return parseInt(data, 10);
    // }

    // async setStoredValue(value: number, fromAddress: string) {
    //     const tx = await this.contract.methods.set(value).send({
    //         ...DEFAULT_SEND_OPTIONS,
    //         from: fromAddress,
    //         value
    //     });

    //     return tx;
    // }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: MyNFTJSON.bytecode,
                arguments: ["Colors", "CLRS"]
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
