import {
  getPerpetualProgramAndProvider,
  PERPETUALS_PROGRAM_ID,
} from "@/utils/constants";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function Home() {
  const { wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const [userSol, setUserSol] = useState(0);

  useEffect(() => {
    async function fetchData() {
      let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);
      let uSol = Number(await connection.getBalance(publicKey!));
      setUserSol(uSol);

      let [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("GLP")],
        PERPETUALS_PROGRAM_ID
      );
      console.log("Pool", pool.toBase58().toString());
      console.log("Perpetual", perpetual_program);

      let poolInfo = await perpetual_program.account.pool.fetch(pool);
      console.log("Pool Info", poolInfo);
      // exhibitInfo = await Exhibition.account.exhibit.fetch(exhibit);
    }
    if (wallet && publicKey) {
      fetchData();
    }
  }, [wallet, publicKey]);

  return (
    <div>
      <p>Hello</p>
      <p>Sol Balance: {(userSol / LAMPORTS_PER_SOL).toFixed(2)}</p>
    </div>
  );
}
