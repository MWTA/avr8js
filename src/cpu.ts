/**
 * AVR 8 CPU data structures
 * Part of AVR8js
 *
 * Copyright (C) 2019, Uri Shaked
 */

import { u16, u8 } from './types';

const registerSpace = 0x100;

export interface ICPU {
  readonly data: Uint8Array;
  readonly dataView: DataView;
  readonly progMem: Uint16Array;
  readonly progBytes: Uint8Array;
  pc: u16;
  cycles: number;

  readData(addr: u16): u8;
  writeData(addr: u16, value: u8): void;
}

export type ICPUMemoryHook = (value: u8, oldValue: u8, addr: u16) => boolean | void;
export interface ICPUMemoryHooks {
  [key: number]: ICPUMemoryHook;
}

export class CPU implements ICPU {
  readonly data: Uint8Array = new Uint8Array(this.sramBytes + registerSpace);
  readonly data16 = new Uint16Array(this.data.buffer);
  readonly dataView = new DataView(this.data.buffer);
  readonly progBytes = new Uint8Array(this.progMem.buffer);
  readonly writeHooks: ICPUMemoryHooks = [];

  pc = 0;
  cycles = 0;

  constructor(public progMem: Uint16Array, private sramBytes = 8192) {
    this.reset();
  }

  reset() {
    this.data.fill(0);
    this.SP = this.data.length - 1;
  }

  readData(addr: number) {
    return this.data[addr];
  }

  writeData(addr: number, value: number) {
    const hook = this.writeHooks[addr];
    if (hook) {
      if (hook(value, this.data[addr], addr)) {
        return;
      }
    }
    this.data[addr] = value;
  }

  get SP() {
    return this.dataView.getUint16(93, true);
  }

  set SP(value: number) {
    this.dataView.setUint16(93, value, true);
  }

  get SREG() {
    return this.data[95];
  }

  get interruptsEnabled() {
    return this.SREG & 0x80 ? true : false;
  }
}
