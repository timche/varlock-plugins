import { plugin, type Resolver } from 'varlock/plugin-lib';

const { SchemaError } = plugin.ERRORS;

plugin.name = 'require-all-or-none';
plugin.icon = 'mdi:link-variant';

function isSet(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

function listKeys(keys: Array<string>) {
  return keys.length === 1 ? keys[0] : `${keys.slice(0, -1).join(', ')} and ${keys.at(-1)}`;
}

plugin.registerRootDecorator({
  name: 'requireAllOrNone',
  isFunction: true,
  useFnArgsResolver: true,
  process(argsResolver: Resolver) {
    if (argsResolver.objArgs) throw new SchemaError('takes only $KEY arguments');
    const keys = (argsResolver.arrArgs ?? []).map((arg) => {
      const key = arg.fnName === 'ref' ? arg.arrArgs?.[0]?.staticValue : undefined;
      if (typeof key !== 'string') throw new SchemaError('arguments must be item references like $CLIENT_ID');
      return key;
    });
    if (keys.length < 2) throw new SchemaError('needs at least 2 items');
    const duplicate = keys.find((key, i) => keys.indexOf(key) !== i);
    if (duplicate) throw new SchemaError(`${duplicate} is listed twice`);
    return { keys, argsResolver };
  },
  async execute({ keys, argsResolver }) {
    const items = keys.map((key) => argsResolver.envGraph!.configSchema[key]);
    // an item that failed on its own already fails the load with its own error
    if (items.some((item) => !item.isValid)) return;
    const set = keys.filter((_, i) => isSet(items[i].resolvedValue));
    if (set.length === 0 || set.length === keys.length) return;
    const missing = keys.filter((key) => !set.includes(key));
    throw new SchemaError(
      `${listKeys(missing)} must be set because ${listKeys(set)} ${set.length === 1 ? 'is' : 'are'} set`,
      { tip: `Set all of ${listKeys(keys)}, or none of them` },
    );
  },
});
