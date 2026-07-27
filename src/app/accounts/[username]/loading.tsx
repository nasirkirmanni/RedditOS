import { SkeletonPanel, SkeletonTiles } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPanel h={40} />
      <SkeletonTiles count={4} />
      <SkeletonPanel h={220} />
      <SkeletonPanel h={140} />
    </div>
  );
}
