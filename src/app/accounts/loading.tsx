import { PageHeading, SkeletonPanel, SkeletonCards } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeading title="Accounts" />
      <SkeletonPanel h={70} />
      <SkeletonCards count={3} />
    </div>
  );
}
