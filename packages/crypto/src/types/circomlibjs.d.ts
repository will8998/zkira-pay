declare module 'circomlibjs' {
  export interface PoseidonField {
    toObject(value: any): bigint;
  }

  export interface PoseidonHasher {
    (inputs: bigint[]): any;
    F: PoseidonField;
  }

  export function buildPoseidon(): Promise<PoseidonHasher>;
}

  export interface MimcSpongeField {
    toObject(value: any): bigint;
  }

  export interface MimcSpongeHasher {
    multiHash(inputs: bigint[], key: number, numOutputs: number): any;
    F: MimcSpongeField;
  }

  export function buildMimcSponge(): Promise<MimcSpongeHasher>;