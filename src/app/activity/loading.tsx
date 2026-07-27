import { PageHeading, SkeletonTable } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeading title="Activity log" />
      <SkeletonTable rows={8} />
    </div>
  );
}
