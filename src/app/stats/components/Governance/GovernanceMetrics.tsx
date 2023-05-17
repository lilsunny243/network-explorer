import { humanReadable } from "@helium/spl-utils"
import {
  humanReadableHnt,
  humanReadableLockup,
  humanReadableVeHNT,
} from "../../utils"
import { fetchGovernanceStats } from "../../utils/fetchGovernanceMetrics"
import { PositionMetrics } from "../../utils/positionsMetrics"
import { StatItem } from "../StatItem"
import { Icon, StatsList } from "../StatsList"
import { GovernanceStatItem } from "./GovernanceStatItem"

type MetricsRowProps = {
  groupStats: PositionMetrics
  icon: Icon
  title: string
}

const MetricsRow = ({ groupStats, icon, title }: MetricsRowProps) => {
  const descriptionSuffix =
    icon === "hnt" || icon === "undelegated" ? "" : ` to ${title}`

  return (
    <StatsList title={title} icon={icon}>
      <div className="grow flex-wrap gap-3 md:flex">
        <div className="flex grow gap-3 pb-3 md:pb-0">
          <StatItem
            label="# of Positions"
            value={humanReadable(groupStats.total.count, 0)}
          />
          <GovernanceStatItem
            header="HNT"
            values={[
              { label: "Total", value: humanReadableHnt(groupStats.total.hnt) },
              {
                label: "Mean",
                value: humanReadableHnt(groupStats.stats.avgHnt),
              },
              {
                label: "Median",
                value: humanReadableHnt(groupStats.stats.medianHnt),
              },
            ]}
            tooltip={{
              id: `${title} positions HNT`,
              description: `Total, mean, and median of HNT delegated${descriptionSuffix}.`,
            }}
          />
        </div>
        <div className="flex grow gap-3">
          <GovernanceStatItem
            header="veHNT"
            values={[
              {
                label: "Total",
                value: humanReadableVeHNT(groupStats.total.vehnt.toString()),
              },
              {
                label: "Mean",
                value: humanReadableVeHNT(groupStats.stats.avgVehnt.toString()),
              },
              {
                label: "Median",
                value: humanReadableVeHNT(
                  groupStats.stats.medianVehnt.toString()
                ),
              },
            ]}
            tooltip={{
              id: `${title} positions veHNT`,
              description: `Total, mean, and median of delegated HNT positions' veHNT voting power.`,
            }}
          />
          <GovernanceStatItem
            header="Lockup"
            values={[
              {
                label: "Mean",
                value: humanReadableLockup(groupStats.stats.avgLockup),
              },
              {
                label: "Median",
                value: humanReadableLockup(groupStats.stats.medianLockup),
              },
            ]}
            tooltip={{
              id: `${title} positions lockup`,
              description: `Mean and median length of time delegated HNT is locked up for.`,
            }}
          />
        </div>
      </div>
    </StatsList>
  )
}

export const GovernanceMetrics = async () => {
  const stats = await fetchGovernanceStats()

  return (
    <>
      <MetricsRow title="Network" icon="hnt" groupStats={stats.network} />
      <MetricsRow title="IOT" icon="iot" groupStats={stats.iot} />
      <MetricsRow title="MOBILE" icon="mobile" groupStats={stats.mobile} />
      <MetricsRow
        title="Undelegated"
        icon="hnt"
        groupStats={stats.undelegated}
      />
    </>
  )
}
