import { BN } from "@coral-xyz/anchor"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes"
import { VoterStakeRegistry } from "@helium/idls/lib/types/voter_stake_registry"
import { PublicKey } from "@solana/web3.js"
import { accountCache } from "./accountCache"
import { calcPositionVotingPower } from "./calcPositionVotingPower"
import { fetchRegistrar } from "./fetchRegistrar"
import { fetchUnixTimestap } from "./fetchUnixTimestamp"
import { getIdlParser } from "./getIdlParser"
import { Position, Registrar } from "./types"

// @ts-ignore
import { IDL as vsrRegistryIDL } from "@helium/idls/voter_stake_registry"

const HELIUM_VSR_ID = "hvsrNC3NKbcryqDs2DocYHZ9yPKEVzdSjQG6RVtK1s8"
const HNT_POSITION_V0_DESCRIMINATOR = [
  152, 131, 154, 46, 158, 42, 31, 233, 153, 231, 240, 209, 136, 172, 103, 141,
  133, 237, 188, 234, 25, 98, 24, 31, 110, 4, 118, 170, 97, 47, 254, 176, 204,
  205, 221, 23, 230, 245, 155, 49,
]
const HNT_POSITION_V0_DESCRIMINATOR_B58 = bs58.encode(
  Buffer.from(HNT_POSITION_V0_DESCRIMINATOR)
)

const positionParser = getIdlParser<VoterStakeRegistry>(
  vsrRegistryIDL as VoterStakeRegistry,
  "positionV0"
)

export const fetchPositions = async () => {
  console.log("fetchPositions triggered")
  const connection = accountCache.connection

  const accounts = await connection.getProgramAccounts(
    new PublicKey(HELIUM_VSR_ID),
    {
      filters: [
        {
          dataSize: 180, // number of bytes
        },
        {
          memcmp: {
            offset: 0, // number of bytes
            bytes: HNT_POSITION_V0_DESCRIMINATOR_B58, // base58 encoded string
          },
        },
      ],
    }
  )

  const accountsParsed = accounts.map((account, i) => {
    return {
      ...account,
      info: positionParser(account.pubkey, account.account) as Position,
    }
  })

  const [registrar, now] = await Promise.all([
    fetchRegistrar(accountsParsed[0].info.registrar),
    fetchUnixTimestap(),
  ])
  const nowBN = new BN(now)
  const mintCfg = (registrar.info as Registrar).votingMints[0]
  console.log({
    lockupSaturationSecs: mintCfg.lockupSaturationSecs,
    baselineVoteWeightScaledFactor: mintCfg.baselineVoteWeightScaledFactor,
    maxExtraLockupVoteWeightScaledFactor:
      mintCfg.maxExtraLockupVoteWeightScaledFactor,
    genesisVotePowerMultiplier: mintCfg.genesisVotePowerMultiplier,
  })

  return accountsParsed.map((pos, index) => {
    let posVotingPower = 0
    if (index === 0) {
      posVotingPower = calcPositionVotingPower({
        position: pos.info,
        registrar: registrar.info as Registrar,
        unixNow: nowBN,
      })
    }

    return { ...pos, veHnt: posVotingPower }
  })
}
