import * as Dropdown from "@radix-ui/react-dropdown-menu";
import CheckmarkIcon from "@carbon/icons-react/lib/Checkmark";
import ChevronDownIcon from "@carbon/icons-react/lib/ChevronDown";
import { twMerge } from "tailwind-merge";
import { useState } from "react";

import { PoolTokens } from "./PoolTokens";
import { Pool } from "@/lib/Pool";

interface Props {
  className?: string;
  pool: Pool;
  onSelectPool?(pool: Pool): void;
  pools: Record<string, Pool>;
}

export function PoolSelector(props: Props) {
  const [open, setOpen] = useState(false);
  // console.log("props.pool", props.pool);

  if (!props.pool) {
    return <p>Loading props.pools</p>;
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger
        className={twMerge(
          "bg-zinc-900",
          "gap-x-1",
          "grid-cols-[24px,1fr,24px]",
          "grid",
          "group",
          "h-11",
          "items-center",
          "px-4",
          "rounded",
          "text-left",
          "w-full",
          props.className
        )}
      >
        <PoolTokens tokens={props.pool.tokenNames} />
        <div className="truncate text-sm font-medium text-white">
          {props.pool.poolName}
        </div>
        <div
          className={twMerge(
            "bg-zinc-900",
            "grid-cols-[24px,1fr,24px]",
            "grid",
            "h-8",
            "items-center",
            "px-4",
            "rounded",
            "text-left",
            "w-full"
          )}
        >
          <ChevronDownIcon className="fill-slate-500  transition-colors group-hover:fill-white" />
        </div>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={8}
          className="w-[392px] overflow-hidden rounded bg-zinc-900 shadow-2xl"
        >
          <Dropdown.Arrow className="fill-zinc-900" />
          {Object.values(props.pools).map((pool) => (
            <Dropdown.Item
              className={twMerge(
                "cursor-pointer",
                "gap-x-1",
                "grid-cols-[24px,1fr,24px]",
                "grid",
                "group",
                "items-center",
                "px-4",
                "py-2.5",
                "text-left",
                "transition-colors",
                "w-full",
                "hover:bg-zinc-700"
              )}
              key={pool.poolAddress}
              onClick={() => props.onSelectPool?.(pool)}
            >
              <PoolTokens tokens={pool.tokenNames} />
              <div>
                <div className="truncate text-sm font-medium text-white">
                  {pool.poolName}
                </div>
                <div className="text-xs text-zinc-500">
                  {pool.tokenNames.slice(0, 3).join(", ")}
                  {pool.tokenNames.length > 3
                    ? ` +${pool.tokenNames.length - 3} more`
                    : ""}
                </div>
              </div>
              {pool.poolAddress === props.pool.poolAddress ? (
                <CheckmarkIcon className="h-4 w-4 fill-white" />
              ) : (
                <div />
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
