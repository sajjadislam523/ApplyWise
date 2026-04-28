"use client";

import { DeleteConfirmModal } from "@/components/jobs/DeleteConfirmModal";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobModal } from "@/components/jobs/JobModal";
import { Button } from "@/components/ui/Button";
import { useJobs } from "@/hooks/useJobs";
import { useAppDispatch } from "@/store";
import { openCreateModal } from "@/store/uiSlice";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";

export default function JobsPage() {
    const dispatch = useAppDispatch();
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useJobs(page);

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-xl font-700 text-white">
                            Applications
                        </h1>
                        {data && (
                            <p className="text-sm text-[#8B98A8] mt-0.5">
                                {data.meta.total} total
                            </p>
                        )}
                    </div>
                    <Button
                        className="flex items-center"
                        onClick={() => dispatch(openCreateModal())}
                    >
                        <FiPlus /> New application
                    </Button>
                </div>

                <JobFilters />

                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-44 rounded-xl bg-[#0F1419] border border-white/6 animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {isError && (
                    <p className="text-center py-12 text-sm text-red-400">
                        Failed to load applications. Check your connection.
                    </p>
                )}

                {!isLoading && data?.data.length === 0 && (
                    <div className="text-center py-16 space-y-3">
                        <p className="text-[#4A5568] text-sm">
                            No applications yet.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => dispatch(openCreateModal())}
                        >
                            Add your first application
                        </Button>
                    </div>
                )}

                {data && data.data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.data.map((job) => (
                            <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                )}

                {data && data.meta.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            ← Previous
                        </Button>
                        <span className="text-sm text-[#8B98A8]">
                            Page {data.meta.page} of {data.meta.totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === data.meta.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next →
                        </Button>
                    </div>
                )}
            </div>

            <JobModal />
            <DeleteConfirmModal />
        </>
    );
}
