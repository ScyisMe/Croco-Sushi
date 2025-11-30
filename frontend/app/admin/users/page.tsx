"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/api/client";
import { User } from "@/lib/types";

// Helper for table columns
const columnHelper = createColumnHelper<User>();

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users", pagination.pageIndex, pagination.pageSize, search, roleFilter, statusFilter],
    queryFn: async () => {
      const params: any = {
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      };

      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== null) params.is_active = statusFilter;

      const response = await apiClient.get<User[]>("/admin/users", { params });
      return response.data;
    },
  });

  // Block/Unblock mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const endpoint = isActive ? `/admin/users/${id}/block` : `/admin/users/${id}/unblock`;
      await apiClient.put(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Статус користувача оновлено");
    },
    onError: () => {
      toast.error("Помилка при оновленні статусу");
    },
  });

  // Columns configuration
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => <span className="text-gray-500">#{info.getValue()}</span>,
    }),
    columnHelper.accessor("name", {
      header: "Ім'я",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {info.getValue()?.charAt(0) || "?"}
          </div>
          <div className="font-medium text-gray-900">{info.getValue() || "Без імені"}</div>
        </div>
      ),
    }),
    columnHelper.accessor("phone", {
      header: "Телефон",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("role", {
      header: "Роль",
      cell: (info) => {
        const role = info.getValue();
        const colors = {
          admin: "bg-purple-100 text-purple-800",
          manager: "bg-blue-100 text-blue-800",
          courier: "bg-yellow-100 text-yellow-800",
          client: "bg-gray-100 text-gray-800",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.client}`}>
            {role}
          </span>
        );
      },
    }),
    columnHelper.accessor("bonus_balance", {
      header: "Бонуси",
      cell: (info) => <span className="font-medium text-primary">{info.getValue()} ₴</span>,
    }),
    columnHelper.accessor("is_active", {
      header: "Статус",
      cell: (info) => (
        info.getValue() ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircleIcon className="w-4 h-4" /> Активний
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <XCircleIcon className="w-4 h-4" /> Заблокований
          </span>
        )
      ),
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 hover:bg-gray-100 rounded-full transition">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={`/admin/users/${info.row.original.id}`}
                      className={`${active ? "bg-gray-100" : ""
                        } block px-4 py-2 text-sm text-gray-700`}
                    >
                      Редагувати
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => toggleBlockMutation.mutate({
                        id: info.row.original.id,
                        isActive: info.row.original.is_active
                      })}
                      className={`${active ? "bg-gray-100" : ""
                        } block w-full text-left px-4 py-2 text-sm ${info.row.original.is_active ? "text-red-600" : "text-green-600"
                        }`}
                    >
                      {info.row.original.is_active ? "Заблокувати" : "Розблокувати"}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // Server-side pagination
    pageCount: -1, // Unknown total pages for now (backend doesn't return total count in this endpoint yet)
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Користувачі</h1>
          <p className="text-gray-500">Управління клієнтами та співробітниками</p>
        </div>
        <Link
          href="/admin/users/new"
          className="btn-primary flex items-center gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          Додати користувача
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук за ім'ям, телефоном або email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={roleFilter || ""}
            onChange={(e) => setRoleFilter(e.target.value || null)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="">Всі ролі</option>
            <option value="client">Клієнт</option>
            <option value="manager">Менеджер</option>
            <option value="admin">Адмін</option>
            <option value="courier">Кур&apos;єр</option>
          </select>
          <select
            value={statusFilter === null ? "" : statusFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val === "" ? null : val === "true");
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="">Всі статуси</option>
            <option value="true">Активні</option>
            <option value="false">Заблоковані</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                // Skeleton loading
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    Користувачів не знайдено
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Попередня
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()} // This might be always true if pageCount is -1, need to handle better
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Наступна
            </button>
          </div>
          <span className="text-sm text-gray-500">
            Сторінка {table.getState().pagination.pageIndex + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
