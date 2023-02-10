import { Pool } from "@/lib/Pool";
import { Side, TradeSide } from "@/lib/Position";
import { getTokenAddress, Token } from "@/lib/Token";
import {
  getPerpetualProgramAndProvider,
  perpetualsAddress,
  PERPETUALS_PROGRAM_ID,
  transferAuthorityAddress,
} from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { checkIfAccountExists } from "@/utils/retrieveData";
import { BN, Wallet } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

// let findProgramAddress = async (label: string, extraSeeds = null) => {
//   let seeds = [Buffer.from(label)];
//   if (extraSeeds) {
//     for (let extraSeed of extraSeeds) {
//       if (typeof extraSeed === "string") {
//         seeds.push(Buffer.from(anchor.utils.bytes.utf8.encode(extraSeed)));
//       } else if (Array.isArray(extraSeed)) {
//         seeds.push(Buffer.from(extraSeed));
//       } else {
//         console.log("extra seed", extraSeed);
//         seeds.push(extraSeed.toBuffer());
//       }
//     }
//   }
//   let res = await PublicKey.findProgramAddress(seeds, PERPETUALS_PROGRAM_ID);
//   return { publicKey: res[0], bump: res[1] };
// };

export async function openPosition(
  pool: Pool,
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction,
  connection: Connection,
  payToken: Token,
  positionToken: Token,
  payAmount: BN,
  positionAmount: BN,
  price: BN,
  side: Side
) {
  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);

  // TODO: need to take slippage as param , this is now for testing 
  const newPrice = side.toString() == 'Long' ? price.mul(new BN(115)).div(new BN(100)) : price.mul(new BN(90)).div(new BN(100))
  console.log(
    "inputs",
    Number(payAmount),
    Number(positionAmount),
    Number(price),
    Number(newPrice),
    payToken,
    side, 
    side.toString()
  );

  console.log("pool", pool);

  // let lpTokenAccount = await getAssociatedTokenAddress(
  //   pool.lpTokenMint,
  //   publicKey
  // );

  let userCustodyTokenAccount = await getAssociatedTokenAddress(
    pool.tokens[getTokenAddress(payToken)]?.mintAccount,
    publicKey
  );

  console.log("tokens", payToken, positionToken);
  let positionAccount = findProgramAddressSync(
    [
      "position",
      publicKey.toBuffer(),
      pool.poolAddress.toBuffer(),
      pool.tokens[getTokenAddress(payToken)]?.custodyAccount.toBuffer(),
      side.toString() == 'Long' ? [1] : [2],
    ],
    perpetual_program.programId
  )[0];

  // console.log(
  //   "left and right",
  //   positionAccount.toString(),
  //   "ALxjVHPdhi7LCoVc2CUbVvPFmnWWCcnNcNAQ4emPg2tz"
  // );

  let transaction = new Transaction();

  try {
    // if (!(await checkIfAccountExists(lpTokenAccount, connection))) {
    //   transaction = transaction.add(
    //     createAssociatedTokenAccountInstruction(
    //       publicKey,
    //       lpTokenAccount,
    //       publicKey,
    //       pool.lpTokenMint
    //     )
    //   );
    // }

    console.log("position account", positionAccount.toString());

    const params : any = {
      price : newPrice, 
    collateral: payAmount,
    size: positionAmount,
    side : side.toString() == 'Long' ? TradeSide.Long : TradeSide.Short,
  }
    let tx = await perpetual_program.methods
      .openPosition(params)
      .accounts({
        owner: publicKey,
        fundingAccount: userCustodyTokenAccount,
        transferAuthority: transferAuthorityAddress,
        perpetuals: perpetualsAddress,
        pool: pool.poolAddress,
        position: positionAccount,
        custody: pool.tokens[getTokenAddress(payToken)]?.custodyAccount,
        custodyOracleAccount:
          pool.tokens[getTokenAddress(payToken)]?.oracleAccount,
        custodyTokenAccount:
          pool.tokens[getTokenAddress(payToken)]?.tokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    transaction = transaction.add(tx);

    console.log("open position tx", transaction);
    console.log("tx keys");
    for (let i = 0; i < transaction.instructions[0].keys.length; i++) {
      console.log(
        "key",
        i,
        transaction.instructions[0].keys[i]?.pubkey.toString()
      );
    }

    await manualSendTransaction(
      transaction,
      publicKey,
      connection,
      signTransaction
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}