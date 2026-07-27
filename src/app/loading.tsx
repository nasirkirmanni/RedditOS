import {
  PageHeading,
  SkeletonTiles,
  SkeletonPanel,
  SkeletonTable,
} from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeading title="Dashboard" />
      <SkeletonTiles count={4} />
      <SkeletonPanel h={90} />
      <SkeletonTable rows={4} />
      <SkeletonPanel h={200} />
    </div>
  );
}
