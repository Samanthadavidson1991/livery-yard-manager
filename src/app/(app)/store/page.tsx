import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSetting, STORE_BANNER_SETTING } from "@/lib/modules";
import { addStoreItem, removeStoreItem } from "@/lib/actions/store";
import {
  Card,
  PageHeader,
  EmptyState,
  LinkButton,
  inputClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

export default async function StorePage() {
  const user = await requireModule("store");
  const banner = await getSetting(STORE_BANNER_SETTING);

  const items = await prisma.catalogItem.findMany({
    where: { type: "STORE", active: true },
    orderBy: { name: "asc" },
  });

  if (user.role === "ADMIN") {
    const orders = await prisma.storeOrder.findMany({
      where: { billed: false },
      include: { livery: true, catalogItem: true },
      orderBy: { createdAt: "desc" },
    });
    return (
      <div>
        <PageHeader
          title="Store"
          subtitle="Items liveries can add to their bill"
          action={<LinkButton href="/admin/catalog">Manage store items</LinkButton>}
        />
        {banner && (
          <div className="bg-amber-100 text-amber-900 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            {banner}
          </div>
        )}
        <Card>
          <h2 className="font-semibold text-brand-900 px-5 pt-5">Pending (unbilled) orders</h2>
          {orders.length === 0 ? (
            <EmptyState title="No pending store orders" />
          ) : (
            <ul className="divide-y divide-gray-100 mt-2">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {o.catalogItem.name} × {o.quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      <Link href={`/admin/liveries/${o.liveryId}`} className="hover:underline">
                        {o.livery.name}
                      </Link>{" "}
                      · {o.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-brand-700">
                    {money(o.catalogItem.price * o.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // Livery view
  const myOrders = await prisma.storeOrder.findMany({
    where: { liveryId: user.liveryId ?? "__none__", billed: false },
    include: { catalogItem: true },
    orderBy: { createdAt: "desc" },
  });
  const total = myOrders.reduce(
    (sum, o) => sum + o.catalogItem.price * o.quantity,
    0,
  );

  return (
    <div>
      <PageHeader title="Store" subtitle="Add items to your bill" />
      {banner && (
        <div className="bg-amber-100 text-amber-900 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
          {banner}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Available items</h2>
          {items.length === 0 ? (
            <EmptyState title="No items available" />
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{it.name}</span>
                    <span className="text-sm font-medium text-brand-700">{money(it.price)}</span>
                  </div>
                  {it.description && (
                    <p className="text-sm text-gray-500 mb-2">{it.description}</p>
                  )}
                  <form action={addStoreItem} className="flex items-center gap-2 mt-2">
                    <input type="hidden" name="catalogItemId" value={it.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      defaultValue={1}
                      className={`${inputClass} w-20`}
                    />
                    <SubmitButton pendingText="Adding…">Add to bill</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Your pending items</h2>
          {myOrders.length === 0 ? (
            <EmptyState title="Nothing added yet" />
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {myOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-800">
                      {o.catalogItem.name} × {o.quantity}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-brand-700">
                        {money(o.catalogItem.price * o.quantity)}
                      </span>
                      <form action={removeStoreItem}>
                        <input type="hidden" name="id" value={o.id} />
                        <button className="text-sm text-red-600 hover:underline">Remove</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 font-semibold">
                <span>Total pending</span>
                <span className="text-brand-700">{money(total)}</span>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
