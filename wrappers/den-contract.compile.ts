import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'contracts/den/den-contract.tolk',
    withSrcLineComments: true,
    withStackComments: true,
};
