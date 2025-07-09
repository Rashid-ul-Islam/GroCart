import React, { useState } from "react";
import { Filter, X, SortAsc } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Select } from "../ui/select";

const MobileFilters = ({
  selectedTab,
  setSelectedTab,
  sortBy,
  setSortBy,
  orderCounts,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { key: "all", label: "All Orders", count: orderCounts.all },
    { key: "pending", label: "Pending", count: orderCounts.pending },
    { key: "in_transit", label: "In Transit", count: orderCounts.in_transit },
    { key: "delivered", label: "Delivered", count: orderCounts.delivered },
    { key: "cancelled", label: "Cancelled", count: orderCounts.cancelled },
  ];

  const sortOptions = [
    { value: "date_desc", label: "Newest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "amount_desc", label: "Highest Amount" },
    { value: "amount_asc", label: "Lowest Amount" },
  ];

  const currentTabLabel =
    tabs.find((tab) => tab.key === selectedTab)?.label || "All Orders";
  const currentSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ||
    "Newest First";

  return (
    <>
      {/* Mobile Filter Trigger */}
      <div className="flex md:hidden space-x-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(true)}
          className="flex-1 justify-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          {currentTabLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(true)}
          className="flex-1 justify-center"
        >
          <SortAsc className="w-4 h-4 mr-2" />
          {currentSortLabel}
        </Button>
      </div>

      {/* Mobile Filter Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50 md:hidden">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Filter & Sort
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Order Status Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Order Status
                </h3>
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTab === tab.key
                          ? "bg-purple-100 border-purple-300 text-purple-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{tab.label}</span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            selectedTab === tab.key
                              ? "bg-purple-200 text-purple-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        sortBy === option.value
                          ? "bg-purple-100 border-purple-300 text-purple-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <Button
                onClick={() => setShowFilters(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default MobileFilters;
