"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Button, 
  DataCard,
  StatusBadge,
  Badge,
  Text,
  PageHeader
} from "@/components/ui";

type Metrics = {
  occupancyRate: number;
  totalIncome: number;
  outstandingRent: number;
  maintenanceCosts: number;
  totals: {
    properties: number;
    units: number;
    tenants: number;
    occupiedUnits: number;
  };
};

type AlertItem = {
  id: string;
  amount?: number;
  dueDate?: string;
  endDate?: string;
  status?: string;
  title?: string;
  createdAt?: string;
  property?: string | null;
  tenant?: string | null;
  unit?: string | null;
  rent?: number;
};

type Alerts = {
  latePayments: { count: number; items: AlertItem[] };
  expiringLeases: { count: number; items: AlertItem[] };
  pendingMaintenance: { count: number; items: AlertItem[] };
};

type Insight = {
  id: string;
  type: string;
  confidence: number | null;
  reasoning: string | null;
  createdAt: string;
  output: Record<string, unknown> | null;
};

type InsightsResponse = {
  items: Insight[];
};

type BusinessInsight = {
  id: string;
  type: 'REVENUE_OPPORTUNITY' | 'COST_OPTIMIZATION' | 'PERFORMANCE_INSIGHT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  businessImpact: {
    amount?: number;
    percentage?: number;
    type: 'revenue' | 'cost_savings' | 'efficiency';
  };
  context: {
    property?: string;
    tenant?: string;
    unit?: string;
    timeframe?: string;
  };
  actions: Array<{
    label: string;
    href: string;
    variant: 'default' | 'secondary' | 'outline';
  }>;
  urgency?: {
    daysRemaining?: number;
    urgencyLevel: 'critical' | 'high' | 'medium' | 'normal';
  };
};

const generateBusinessInsights = (alerts: Alerts | null, metrics: Metrics | null): BusinessInsight[] => {
  const insights: BusinessInsight[] = [];
  
  // Revenue Opportunity Insights from Expiring Leases
  if (alerts?.expiringLeases.items) {
    alerts.expiringLeases.items.slice(0, 2).forEach((lease) => {
      const daysUntilExpiry = lease.endDate 
        ? Math.ceil((new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const currentRent = lease.rent ?? 1000;
      const potentialIncrease = Math.floor(currentRent * 0.05); // 5% market increase estimate
      
      insights.push({
        id: `revenue-${lease.id}`,
        type: 'REVENUE_OPPORTUNITY',
        priority: daysUntilExpiry <= 15 ? 'HIGH' : 'MEDIUM',
        title: `Lease renewal opportunity - market rent +$${potentialIncrease}/month`,
        description: `${lease.tenant ?? 'Tenant'} (${lease.unit ? `Unit ${lease.unit}` : lease.property ?? 'Property'})`,
        businessImpact: {
          amount: potentialIncrease * 12,
          type: 'revenue'
        },
        context: {
          property: lease.property ?? undefined,
          tenant: lease.tenant ?? undefined,
          unit: lease.unit ?? undefined,
          timeframe: `${daysUntilExpiry} days remaining`
        },
        actions: [
          { label: 'Send Renewal Offer', href: `/leases?action=renew&id=${lease.id}`, variant: 'default' },
          { label: 'Schedule Meeting', href: `/tenants?action=schedule&tenant=${lease.tenant}`, variant: 'secondary' },
          { label: 'Market Analysis', href: `/properties/market-analysis?property=${lease.property}`, variant: 'outline' }
        ],
        urgency: {
          daysRemaining: daysUntilExpiry,
          urgencyLevel: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : 'medium'
        }
      });
    });
  }

  // Cost Optimization Insights from Pending Maintenance
  if (alerts?.pendingMaintenance.items) {
    alerts.pendingMaintenance.items.slice(0, 1).forEach((maintenance) => {
      const createdDate = maintenance.createdAt ? new Date(maintenance.createdAt) : new Date();
      const daysOpen = Math.ceil((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const estimatedSavings = Math.floor(daysOpen * 50); // $50/day preventive savings estimate
      
      insights.push({
        id: `cost-${maintenance.id}`,
        type: 'COST_OPTIMIZATION',
        priority: daysOpen > 14 ? 'HIGH' : 'MEDIUM',
        title: `${daysOpen > 30 ? 'HVAC maintenance overdue' : 'Preventive maintenance opportunity'}`,
        description: `${maintenance.property ?? 'Property'} - prevent emergency repairs`,
        businessImpact: {
          amount: estimatedSavings,
          type: 'cost_savings'
        },
        context: {
          property: maintenance.property ?? undefined,
          timeframe: `${daysOpen} days open`
        },
        actions: [
          { label: 'Schedule Service', href: `/vendors?action=schedule&id=${maintenance.id}`, variant: 'default' },
          { label: 'Get Quotes', href: `/vendors?action=quotes&id=${maintenance.id}`, variant: 'secondary' },
          { label: 'Add to Calendar', href: `/calendar?action=add&type=maintenance&id=${maintenance.id}`, variant: 'outline' }
        ],
        urgency: {
          daysRemaining: Math.max(0, 30 - daysOpen),
          urgencyLevel: daysOpen > 30 ? 'critical' : daysOpen > 14 ? 'high' : 'medium'
        }
      });
    });
  }

  // Performance Insights from Metrics
  if (metrics) {
    // Rent collection efficiency insight
    if (alerts?.latePayments.count !== undefined) {
      const totalUnits = metrics.totals.units;
      const latePayments = alerts.latePayments.count;
      const collectionRate = totalUnits > 0 ? ((totalUnits - latePayments) / totalUnits) * 100 : 100;
      
      if (collectionRate >= 85) {
        insights.push({
          id: 'performance-collection',
          type: 'PERFORMANCE_INSIGHT',
          priority: 'LOW',
          title: `Rent collection performing well at ${collectionRate.toFixed(0)}%`,
          description: `${totalUnits - latePayments}/${totalUnits} tenants paid on time`,
          businessImpact: {
            percentage: collectionRate,
            type: 'efficiency'
          },
          context: {
            timeframe: 'Current month'
          },
          actions: [
            { label: 'View Report', href: '/cashflow?view=collection-report', variant: 'default' },
            { label: 'Setup Automation', href: '/settings?section=payments', variant: 'secondary' },
            { label: 'Share Success', href: '/dashboard?share=collection-performance', variant: 'outline' }
          ]
        });
      }
    }

    // Occupancy optimization insight
    const occupancyRate = metrics.occupancyRate * 100;
    if (occupancyRate >= 90 && metrics.totals.units - metrics.totals.occupiedUnits > 0) {
      const vacantUnits = metrics.totals.units - metrics.totals.occupiedUnits;
      const avgRent = metrics.totalIncome / (metrics.totals.occupiedUnits || 1);
      const revenueOpportunity = vacantUnits * avgRent;
      
      insights.push({
        id: 'performance-occupancy',
        type: 'REVENUE_OPPORTUNITY',
        priority: 'MEDIUM',
        title: `${vacantUnits} unit${vacantUnits > 1 ? 's' : ''} available - revenue opportunity`,
        description: `Strong portfolio performance at ${occupancyRate.toFixed(0)}% occupancy`,
        businessImpact: {
          amount: revenueOpportunity,
          type: 'revenue'
        },
        context: {
          timeframe: 'Monthly potential'
        },
        actions: [
          { label: 'List Units', href: '/properties?action=list-vacant', variant: 'default' },
          { label: 'Marketing Plan', href: '/marketing?action=vacancy-campaign', variant: 'secondary' },
          { label: 'Adjust Pricing', href: '/properties?action=pricing-review', variant: 'outline' }
        ]
      });
    }
  }

  // Sort by priority (HIGH -> MEDIUM -> LOW) and limit to 5 insights
  const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
  return insights
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 5);
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [_insights, setInsights] = useState<Insight[]>([]);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metricsData, alertsData, insightsData] = await Promise.all([
          apiFetch<Metrics>("/api/dashboard/metrics", { auth: true }),
          apiFetch<Alerts>("/api/dashboard/alerts", { auth: true }),
          apiFetch<InsightsResponse>("/api/insights", { auth: true })
        ]);
        setMetrics(metricsData);
        setAlerts(alertsData);
        setInsights(insightsData.items.slice(0, 6));
        
        // Generate business insights from alerts and metrics
        const businessInsightsData = generateBusinessInsights(alertsData, metricsData);
        setBusinessInsights(businessInsightsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const occupancy = useMemo(() => {
    if (!metrics) return "-";
    const rate = (metrics.occupancyRate * 100).toFixed(0);
    return `${rate}% (${metrics.totals.occupiedUnits}/${metrics.totals.units})`;
  }, [metrics]);

  // Calculate simple trend indicators for metrics (mock logic for Week 1)
  const getTrendIndicator = (_type: string) => {
    const mock = Math.random();
    if (mock > 0.6) return { icon: "↗", color: "text-emerald-400", label: "up" };
    if (mock > 0.4) return { icon: "↔", color: "text-muted-foreground", label: "same" };
    return { icon: "↘", color: "text-rose-400", label: "down" };
  };

  // Smart Quick Actions based on alerts
  const getSmartActions = () => {
    const actions = [];
    if ((alerts?.latePayments.count ?? 0) > 0) {
      actions.push({
        label: "Send Payment Reminders",
        href: "/cashflow?view=reminders",
        priority: true
      });
    }
    if ((alerts?.expiringLeases.count ?? 0) > 0) {
      actions.push({
        label: "Review Lease Renewals", 
        href: "/leases?view=expiring",
        priority: true
      });
    }
    if ((alerts?.pendingMaintenance.count ?? 0) > 0) {
      actions.push({
        label: "Schedule Maintenance",
        href: "/vendors?view=pending",
        priority: true
      });
    }
    return actions.slice(0, 2); // Max 2 smart actions
  };

  // Format dates with urgency
  const formatDateWithUrgency = (dateStr: string, type: 'due' | 'ending') => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const dateDisplay = date.toLocaleDateString();
    if (diffDays < 0) return { text: `${type === 'due' ? 'Overdue' : 'Expired'} ${Math.abs(diffDays)}d`, urgency: 'critical' };
    if (diffDays <= 3) return { text: `${dateDisplay} (${diffDays}d)`, urgency: 'high' };
    if (diffDays <= 7) return { text: `${dateDisplay} (${diffDays}d)`, urgency: 'medium' };
    return { text: dateDisplay, urgency: 'normal' };
  };

  const getUrgencyColor = (urgency: string, type: 'text' | 'bg' = 'text') => {
    const colors = {
      critical: type === 'text' ? 'text-rose-300' : 'bg-rose-500/20',
      high: type === 'text' ? 'text-orange-300' : 'bg-orange-500/20', 
      medium: type === 'text' ? 'text-amber-300' : 'bg-amber-500/20',
      normal: type === 'text' ? 'text-muted-foreground' : 'bg-muted'
    };
    return colors[urgency as keyof typeof colors] || colors.normal;
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your property portfolio performance and key metrics."
      />
      
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Properties",
            value: metrics?.totals.properties ?? 0,
            detail: "Portfolio count"
          },
          {
            label: "Units",
            value: metrics?.totals.units ?? 0,
            detail: `Occupancy ${occupancy}`
          },
          {
            label: "Tenants",
            value: metrics?.totals.tenants ?? 0,
            detail: "Active profiles"
          },
          {
            label: "Total Income",
            value: `$${(metrics?.totalIncome ?? 0).toLocaleString()}`,
            detail: "Paid rent receipts"
          }
        ].map((card) => {
          const trend = getTrendIndicator(card.label);
          return (
            <DataCard
              key={card.label}
              title={card.label}
              value={card.value}
              detail={card.detail}
              trend={{
                direction: trend.label === 'up' ? 'up' : trend.label === 'down' ? 'down' : 'neutral',
                label: trend.label,
                color: trend.label === 'up' ? 'success' : trend.label === 'down' ? 'error' : 'neutral'
              }}
            />
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <DataCard
          title="Alerts & Follow-ups"
          subtitle="Focus on what needs action today."
          size="lg"
          footer={
            <Text variant="muted" size="sm">
              Outstanding rent: <Text variant="error" className="inline">
                ${(metrics?.outstandingRent ?? 0).toLocaleString()}
              </Text>
            </Text>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Late Payments",
                items: alerts?.latePayments.items ?? [],
                empty: "No late payments",
                badge: alerts?.latePayments.count ?? 0,
                actionLabel: "Follow Up",
                actionHref: "/cashflow?view=late"
              },
              {
                title: "Expiring Leases",
                items: alerts?.expiringLeases.items ?? [],
                empty: "No leases ending soon",
                badge: alerts?.expiringLeases.count ?? 0,
                actionLabel: "Review Renewal",
                actionHref: "/leases?view=expiring"
              },
              {
                title: "Pending Maintenance",
                items: alerts?.pendingMaintenance.items ?? [],
                empty: "No maintenance backlog",
                badge: alerts?.pendingMaintenance.count ?? 0,
                actionLabel: "Schedule Service",
                actionHref: "/vendors?view=pending"
              }
            ].map((group) => (
              <DataCard
                key={group.title}
                title={group.title}
                badge={<Badge variant="outline">{group.badge}</Badge>}
                size="sm"
                action={
                  group.badge > 0 ? (
                    <Button asChild size="sm" variant="secondary">
                      <Link href={group.actionHref}>{group.actionLabel}</Link>
                    </Button>
                  ) : undefined
                }
              >
                <div className="space-y-2 text-xs text-muted-foreground">
                  {group.items.length === 0 && <Text variant="muted" size="sm">{group.empty}</Text>}
                  {group.items.slice(0, 3).map((item) => {
                    const urgency = item.dueDate 
                      ? formatDateWithUrgency(item.dueDate, 'due')
                      : item.endDate 
                      ? formatDateWithUrgency(item.endDate, 'ending')
                      : null;

                    return (
                      <div 
                        key={item.id} 
                        className={`rounded-lg border border-border p-2 ${
                          urgency ? getUrgencyColor(urgency.urgency, 'bg') : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Text size="sm" weight="semibold" truncate>
                              {item.property ?? "Property"}
                            </Text>
                            <Text variant="muted" size="xs" truncate>
                              {item.tenant ?? "Tenant"} {item.unit ? `· Unit ${item.unit}` : ""}
                            </Text>
                            {item.amount && (
                              <Text variant="error" size="xs" weight="medium">
                                ${item.amount.toLocaleString()}
                              </Text>
                            )}
                          </div>
                          {urgency && (
                            <StatusBadge
                              status={urgency.urgency === 'critical' ? 'OVERDUE' : urgency.urgency === 'high' ? 'PENDING' : 'ACTIVE'}
                              size="sm"
                              showIcon={false}
                              customLabel={urgency.urgency === 'critical' ? '!' : urgency.urgency === 'high' ? '!!' : ''}
                            />
                          )}
                        </div>
                        {urgency && (
                          <Text variant="muted" size="xs" className={getUrgencyColor(urgency.urgency)}>
                            {urgency.text}
                          </Text>
                        )}
                        {item.title && (
                          <Text variant="muted" size="xs" truncate className="mt-1">{item.title}</Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DataCard>
            ))}
          </div>
        </DataCard>

        <div className="space-y-4">
          <DataCard
            title="Quick Actions"
            subtitle="Jump into daily workflows."
            size="lg"
          >
            <div className="grid gap-3">
              {/* Smart Actions based on current alerts */}
              {getSmartActions().map((action, index) => (
                <Button 
                  key={action.href} 
                  asChild 
                  variant={index === 0 ? "default" : "secondary"}
                  size="sm"
                  className="justify-start bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30"
                >
                  <Link href={action.href}>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {action.label}
                    </span>
                  </Link>
                </Button>
              ))}
              
              {/* Standard Actions */}
              <Button asChild className="justify-start">
                <Link href="/properties/new">Add property</Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/tenants/new">Add tenant</Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/cashflow">Log an expense</Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/documents">Upload document</Link>
              </Button>
            </div>
          </DataCard>

          <DataCard
            title="AI Action Center"
            subtitle="Prioritized business insights"
            badge={<Badge variant="outline">{businessInsights.length} insights</Badge>}
            size="lg"
          >
            <div className="space-y-3">
              {businessInsights.length === 0 && (
                <Text variant="muted" size="sm">No actionable insights available.</Text>
              )}
              {businessInsights.map((insight) => {
                const getPriorityColors = (priority: string) => {
                  switch (priority) {
                    case 'HIGH': return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300' };
                    case 'MEDIUM': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' };
                    case 'LOW': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' };
                    default: return { bg: 'bg-muted/50', border: 'border-border', badge: 'bg-muted text-muted-foreground' };
                  }
                };
                
                const colors = getPriorityColors(insight.priority);
                const typeIcons = {
                  'REVENUE_OPPORTUNITY': '🎯',
                  'COST_OPTIMIZATION': '🔧', 
                  'PERFORMANCE_INSIGHT': '📊'
                };
                
                return (
                  <div key={insight.id} className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{typeIcons[insight.type]}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.badge}`}>
                          {insight.priority}
                        </span>
                      </div>
                      {insight.urgency && (
                        <Text variant="muted" size="xs">
                          {insight.urgency.daysRemaining !== undefined && insight.urgency.daysRemaining >= 0
                            ? `${insight.urgency.daysRemaining}d left`
                            : insight.context.timeframe
                          }
                        </Text>
                      )}
                    </div>
                    
                    <Text size="sm" weight="semibold" className="mb-1">
                      {insight.title}
                    </Text>
                    <Text variant="muted" size="xs" className="mb-2">
                      {insight.description}
                    </Text>
                    
                    {/* Business Impact */}
                    {insight.businessImpact.amount && (
                      <div className="mb-3">
                        <Text variant="muted" size="xs" className="inline">
                          {insight.businessImpact.type === 'revenue' ? 'Potential revenue: ' : 'Estimated savings: '}
                        </Text>
                        <Text 
                          size="xs" 
                          weight="semibold" 
                          variant={insight.businessImpact.type === 'revenue' ? 'success' : 'primary'}
                          className="inline"
                        >
                          ${insight.businessImpact.amount.toLocaleString()}
                          {insight.businessImpact.type === 'revenue' && insight.context.timeframe?.includes('annual') ? '/year' : ''}
                        </Text>
                      </div>
                    )}
                    {insight.businessImpact.percentage && (
                      <div className="mb-3">
                        <Text variant="muted" size="xs" className="inline">Performance: </Text>
                        <Text size="xs" weight="semibold" variant="success" className="inline">
                          {insight.businessImpact.percentage.toFixed(0)}%
                        </Text>
                      </div>
                    )}
                    
                    {/* Context Information */}
                    {(insight.context.property || insight.context.tenant) && (
                      <div className="mb-3">
                        <Text variant="muted" size="xs">
                          {insight.context.property && insight.context.property}
                          {insight.context.tenant && (
                            <>{insight.context.property ? ' • ' : ''}{insight.context.tenant}</>
                          )}
                          {insight.context.unit && <> • Unit {insight.context.unit}</>}
                        </Text>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1.5 flex-wrap">
                      {insight.actions.slice(0, 3).map((action, index) => (
                        <Button 
                          key={action.href}
                          asChild
                          size="sm"
                          variant={index === 0 ? "default" : action.variant as 'default' | 'secondary' | 'outline'}
                        >
                          <Link href={action.href}>{action.label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataCard>
        </div>
      </section>

      {error && <Text variant="error" size="sm">{error}</Text>}
    </div>
  );
}
