import { PageHeading, SkeletonPanel } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeading title="Subreddits" />
      <SkeletonPanel h={60} />
      <SkeletonPanel h={90} />
      <SkeletonPanel h={90} />
    </div>
  );
}
