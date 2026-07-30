'use client';

import { ProductModule } from '@/types';

export const ORGANISATION_CORE_MODULE_KEY = 'organisation';

export interface OrganisationEnabledModulesFieldsProps {
  modulesMode: 'all' | 'custom';
  setModulesMode: (mode: 'all' | 'custom') => void;
  enabledModuleKeys: string[];
  setEnabledModuleKeys: React.Dispatch<React.SetStateAction<string[]>>;
  moduleCatalog: ProductModule[];
  canLoadModuleCatalog: boolean;
  /** Distinct `name` for radio groups when multiple forms exist in the document. */
  radioGroupName: string;
  /** Wording for keys not present in the product catalog. */
  variant?: 'create' | 'edit';
}

export default function OrganisationEnabledModulesFields({
  modulesMode,
  setModulesMode,
  enabledModuleKeys,
  setEnabledModuleKeys,
  moduleCatalog,
  canLoadModuleCatalog,
  radioGroupName,
  variant = 'edit',
}: OrganisationEnabledModulesFieldsProps) {
  const core = ORGANISATION_CORE_MODULE_KEY;
  const orphanHint =
    variant === 'create'
      ? 'Keys not in the current catalog (uncheck to remove):'
      : 'Keys on this org not in the current catalog (keep or uncheck to remove):';

  return (
    <div className="border-t border-gray-100 pt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Tenant modules</label>
      <p className="text-xs text-gray-500 mb-3">
        Choose whether this organization may use all catalog modules or only a subset. Maps to{' '}
        <code className="bg-gray-100 px-1 rounded">enabled_modules</code> on{' '}
        {variant === 'create' ? (
          <span>staff <code className="bg-gray-100 px-1 rounded">POST /organisation/</code></span>
        ) : (
          <span>the staff organisation API</span>
        )}
        .
      </p>
      <div className="space-y-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioGroupName}
            className="mt-1 border-gray-300 text-admin focus:ring-admin"
            checked={modulesMode === 'all'}
            onChange={() => {
              setModulesMode('all');
              setEnabledModuleKeys([core]);
            }}
          />
          <span className="text-sm text-gray-800">
            All modules available{' '}
            <span className="text-gray-500">
              ({variant === 'create' ? 'omit field / all modules' : 'send null — no explicit restriction'})
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioGroupName}
            className="mt-1 border-gray-300 text-admin focus:ring-admin"
            checked={modulesMode === 'custom'}
            onChange={() => setModulesMode('custom')}
          />
          <span className="text-sm text-gray-800">Only selected modules</span>
        </label>
      </div>

      {modulesMode === 'custom' && (
        <div className="mt-4 pl-1 space-y-4">
          {moduleCatalog.length > 0 ? (
            <div className="space-y-2 border-l-2 border-gray-200 pl-4">
              {moduleCatalog.map((m) => {
                const isCore = m.key === core;
                const checked = isCore || enabledModuleKeys.includes(m.key);
                return (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isCore}
                      checked={checked}
                      onChange={(e) => {
                        if (isCore) return;
                        setEnabledModuleKeys((prev) => {
                          if (e.target.checked) {
                            return Array.from(new Set([...prev, m.key]));
                          }
                          return prev.filter((k) => k !== m.key);
                        });
                      }}
                      className="rounded border-gray-300 text-admin focus:ring-admin disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-800">
                      {m.label} <span className="font-mono text-xs text-gray-400">({m.key})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Module keys (comma-separated)</label>
              <input
                type="text"
                value={enabledModuleKeys.filter((k) => k !== core).join(', ')}
                onChange={(e) => {
                  const parts = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setEnabledModuleKeys([core, ...parts]);
                }}
                placeholder="e.g. pm, hr, tickets"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {canLoadModuleCatalog
                  ? 'No rows in the product module catalog yet, or the list could not be loaded. Keys must match backend module keys.'
                  : 'You cannot load the module catalog with your permissions; enter keys manually.'}
              </p>
            </div>
          )}

          {moduleCatalog.length > 0 &&
            enabledModuleKeys.some((k) => !moduleCatalog.some((m) => m.key === k)) && (
              <div>
                <p className="text-xs font-medium text-amber-800 mb-1">{orphanHint}</p>
                <div className="flex flex-wrap gap-2">
                  {enabledModuleKeys
                    .filter((k) => !moduleCatalog.some((m) => m.key === k))
                    .map((k) => (
                      <label
                        key={k}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-200 bg-amber-50 text-xs font-mono"
                      >
                        <input
                          type="checkbox"
                          checked
                          disabled={k === core}
                          onChange={() => {
                            if (k === core) return;
                            setEnabledModuleKeys((prev) => prev.filter((x) => x !== k));
                          }}
                          className="rounded border-gray-300 text-admin"
                        />
                        {k}
                      </label>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
