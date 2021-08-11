import Web3 from 'web3';
import * as ContractArtifact from '../../../build/contracts/ERC20.json';

const SUDT_PROXY_ADDRESS = '0xC50F24B107052687FF2b46da6D5aB6cE682377a6';

export async function getLayer2ckETHBalance (web3: Web3, polyjuiceAddress: string, ethAddress: string) {
    const contract = new web3.eth.Contract(ContractArtifact.abi as any, SUDT_PROXY_ADDRESS) as any;
    return await contract.methods.balanceOf (polyjuiceAddress).call ({
        from: ethAddress
    });
}
