import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { asToken, Token, tokenAddressToToken } from "@/lib/Token";

import { TokenSelector } from "../TokenSelector";
import { LeverageSlider } from "../LeverageSlider";
import { TradeDetails } from "./TradeDetails";
import { SolidButton } from "../SolidButton";
import { TradePositionDetails } from "./TradePositionDetails";
import { PoolSelector } from "../PoolSelector";
import { useRouter } from "next/router";
import { Pool } from "@/lib/Pool";
import { Tab } from ".";
import { openPosition } from "src/actions/openPosition";
import { usePools } from "@/hooks/usePools";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { token } from "@metaplex-foundation/js";
import { fetchTokenBalance } from "@/utils/retrieveData";
import { LoadingDots } from "../LoadingDots";
import { usePositions } from "@/hooks/usePositions";

interface Props {
  className?: string;
  side: Tab;
}

enum Input {
  Pay = "pay",
  Position = "position",
}

export function TradePosition(props: Props) {
  const [payToken, setPayToken] = useState(Token.SOL);
  const [positionToken, setPositionToken] = useState(Token.SOL);
  const [payTokenBalance, setPayTokenBalance] = useState<number | null>(null);

  const [payAmount, setPayAmount] = useState(0.1);
  const [positionAmount, setPositionAmount] = useState(0.2);

  const [lastChanged, setLastChanged] = useState<Input>(Input.Pay);

  const [leverage, setLeverage] = useState(1);

  const { publicKey, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();

  const { fetchPositions } = usePositions();

  const { pools } = usePools();
  const [pool, setPool] = useState<Pool | null>(null);

  const allPriceStats = useDailyPriceStats();
  const router = useRouter();

  const { pair } = router.query;

  let tokenList: Token[] = [];

  async function handleTrade() {
    await openPosition(
      pool,
      wallet,
      publicKey,
      signTransaction,
      connection,
      payToken,
      positionToken,
      new BN(payAmount * LAMPORTS_PER_SOL),
      new BN(positionAmount * LAMPORTS_PER_SOL),
      new BN(allPriceStats[payToken]?.currentPrice * 10 ** 6),
      props.side
    );
    fetchPositions();
    // router.reload(window.location.pathname);
  }

  useEffect(() => {
    setPositionToken(asToken(pair.split("-")[0]));
  }, [pair]);

  useEffect(() => {
    async function fetchData() {
      let tokenBalance = await fetchTokenBalance(
        payToken,
        publicKey,
        connection
      );

      setPayTokenBalance(tokenBalance);
    }
    if (publicKey) {
      fetchData();
    }
  }, [connection, payToken, publicKey]);

  const entryPrice = allPriceStats[payToken]?.currentPrice * payAmount || 0;
  const liquidationPrice = entryPrice * leverage;

  if (!pair) {
    return <p>Pair not loaded</p>;
  }

  if (pools === undefined) {
    return <LoadingDots />;
  } else if (pool === null) {
    setPool(Object.values(pools)[0]);
    return <LoadingDots />;
  } else {
    return (
      <div className={props.className}>
        <div className="flex items-center justify-between text-sm ">
          <div className="font-medium text-white">You Pay</div>
          {publicKey && (
            <div
              className="flex flex-row space-x-1 font-medium text-white hover:cursor-pointer"
              onClick={() => setPayAmount(payTokenBalance)}
            >
              <p>{payTokenBalance?.toFixed(3) ?? 0}</p>
              <p className="font-normal">{payToken}</p>
              <p className="text-zinc-400"> Balance</p>
            </div>
          )}
        </div>
        <TokenSelector
          className="mt-2"
          amount={payAmount}
          token={payToken}
          onChangeAmount={(e) => {
            console.log("token selector wrp on change", e);
            setPayAmount(e);
            setPositionAmount(e * leverage);
            setLastChanged(Input.Pay);
          }}
          onSelectToken={setPayToken}
          tokenList={Object.keys(pool.tokens).map((token) => {
            return tokenAddressToToken(token);
          })}
        />
        <div className="mt-4 text-sm font-medium text-white">
          Your {props.side}
        </div>
        <TokenSelector
          className="mt-2"
          amount={positionAmount}
          token={positionToken}
          onChangeAmount={(e) => {
            setPayAmount(e / leverage);
            setPositionAmount(e);
            setLastChanged(Input.Position);
          }}
          onSelectToken={(token) => {
            setPositionToken(token);
            router.push("/trade/" + token + "-USD");
          }}
          tokenList={Object.keys(pool.tokens).map((token) => {
            return tokenAddressToToken(token);
          })}
        />
        <div className="mt-4 text-xs text-zinc-400">Pool</div>
        <PoolSelector
          className="mt-2"
          pool={pool}
          onSelectPool={setPool}
          pools={pools}
        />
        <LeverageSlider
          className="mt-6"
          value={leverage}
          onChange={(e) => {
            if (lastChanged === Input.Pay) {
              setPositionAmount(payAmount * e);
            } else {
              setPayAmount(positionAmount / e);
            }
            setLeverage(e);
          }}
        />
        <SolidButton className="mt-6 w-full" onClick={handleTrade}>
          Place Order
        </SolidButton>
        <TradeDetails
          className="mt-4"
          collateralToken={payToken}
          entryPrice={entryPrice}
          liquidationPrice={liquidationPrice}
          fees={0.05}
        />
        <TradePositionDetails
          availableLiquidity={3871943.82}
          borrowFee={0.0052}
          className={twMerge(
            "-mb-4",
            "-mx-4",
            "bg-zinc-900",
            "mt-4",
            "pb-5",
            "pt-4",
            "px-4"
          )}
          entryPrice={16.4}
          exitPrice={16.4}
          token={positionToken}
          side={props.side}
        />
      </div>
    );
  }
}
