import { PageHeading, SkeletonPanel } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeading title="Settings" />
      <SkeletonPanel h={80} />
      <SkeletonPanel h={80} />
      <SkeletonPanel h={120} />
    </div>
  );
}
