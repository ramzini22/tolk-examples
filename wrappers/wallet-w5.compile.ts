import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'contracts/wallet-v5/wallet-v5-contract.tolk',
    withStackComments: true, // Fift output will contain comments, if you wish to debug its output
    withSrcLineComments: true, // Fift output will contain .tolk lines as comments
};
