import {
  CategoryBreakdown,
  CategoryBubbleChart,
  TrendLineChart,
} from "../components/analytics";

import ExpenseFilterPanel from "../components/expenseFilterPanel";
import PanelCard from "../components/ui/PanelCard";
import AnalyticsProvider from "../providers/AnalyticsProvider";

export default function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <section className="grid gap-4">
        <PanelCard>
          <ExpenseFilterPanel className="grid gap-4" />
        </PanelCard>

        <div className="grid gap-3">
          <TrendLineChart />

          <div className="grid gap-3 lg:grid-cols-[3fr_1fr]">
            <CategoryBubbleChart />
            <CategoryBreakdown />
          </div>
        </div>
      </section>
    </AnalyticsProvider>
  );
}
