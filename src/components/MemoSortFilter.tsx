import React from "react";
import { ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortBy, FilterBy } from "@/types/memo";

interface MemoSortFilterProps {
  sortBy: SortBy;
  filterBy: FilterBy;
  selectedCategory?: string;
  categories: string[];
  onSortChange: (sort: SortBy) => void;
  onFilterChange: (filter: FilterBy, category?: string) => void;
}

export const MemoSortFilter: React.FC<MemoSortFilterProps> = ({
  sortBy,
  filterBy,
  selectedCategory,
  categories = [],
  onSortChange,
  onFilterChange,
}) => {
  const sortOptions = [
    { value: "updatedAt" as const, label: "최근 수정일순" },
    { value: "createdAt" as const, label: "생성일순" },
    { value: "importance" as const, label: "중요도순" },
    { value: "title" as const, label: "제목순" },
  ];

  const getSortLabel = () => {
    return (
      sortOptions.find((option) => option.value === sortBy)?.label || "정렬"
    );
  };

  const getFilterLabel = () => {
    if (filterBy === "category" && selectedCategory) {
      return `카테고리: ${selectedCategory}`;
    }
    return "전체";
  };

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{getSortLabel()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={sortBy === option.value ? "bg-blue-50" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>{getFilterLabel()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onFilterChange("all")}
            className={filterBy === "all" ? "bg-blue-50" : ""}
          >
            전체
          </DropdownMenuItem>
          {categories?.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => onFilterChange("category", category)}
              className={
                filterBy === "category" && selectedCategory === category
                  ? "bg-blue-50"
                  : ""
              }
            >
              카테고리: {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
