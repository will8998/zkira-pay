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