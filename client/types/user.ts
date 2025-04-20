

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  PassKey: Passkey[];
}

export type Passkey = {
  id: number;
  name: string;
  passkey_id: string;
  device_type: string;
  back_up: boolean;
}
 