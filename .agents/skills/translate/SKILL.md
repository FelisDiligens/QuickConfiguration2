---
name: translate
description: Translate literal strings in the code base. Use when the user asks you to translate strings.
user-invocable: true
allowed-tools:
  - read_file
  - grep
  - ask_user_question
  - search_replace
  - write_file
---

# Instructions for translations

The task is to translate literal strings in React components, such as:

```tsx
<thead>
  <tr>
    <th className="expand">
      Mod name and info
    </th>
    <th className="center">
      Version
    </th>
    <th className="center">
      Status
    </th>
    <th className="center">
      Endorsed
    </th>
    <th className="center">
      Actions
    </th>
  </tr>
</thead>
```

Move them into `./src/i18n/en.json`:

```json
{
  "mods": {
    "modOrderTab": {
      "table": {
        "header": {
          "modName": "Mod name & info",
          "version": "Version",
          "status": "Status",
          "endorsed": "Endorsed",
          "actions": "Actions"
        }
      }
    }
  }
}
```

And replace the literal strings with calls to the `t` function:

```tsx
<thead>
  <tr>
    <th className="expand">
      {t("mods.modOrderTab.table.header.modName")}
    </th>
    <th className="center">
      {t("mods.modOrderTab.table.header.version")}
    </th>
    <th className="center">
      {t("mods.modOrderTab.table.header.status")}
    </th>
    <th className="center">
      {t("mods.modOrderTab.table.header.endorsed")}
    </th>
    <th className="center">
      {t("mods.modOrderTab.table.header.actions")}
    </th>
  </tr>
</thead>
```

If the literal string is within TypeScript code instead of a React component (JSX), such as:

```ts
const text = `Removing mod ${removedMods + 1} of ${totalMods}: ${modTitle}, file ${removedFiles + 1} of ${totalFiles}: ${fileName}`;
```

You can still translate it like so:

```json
"removingModStatusText": "Removing mod {{removedMods}} of {{totalMods}}: {{modTitle}}, file {{removedFiles}} of {{totalFiles}}: {{fileName}}",
```

And replace the literal string with a call to the `t` function:

```ts
const text = t("mods.modOrderTab.progress.removingModStatusText", {
  removedMods: removedMods + 1,
  totalMods,
  modTitle,
  removedFiles: removedFiles + 1,
  totalFiles,
  fileName
});
```

Use

```bash
pnpm lint
```

to identify literal strings and TODO comments mentioning missing translations.

Once you're done with the English `en.json` translations, also add German translations to `de.json`.

## Additional context

- The code base uses `i18next` and `react-i18next`.
- Translation files are located in `./src/i18n/*.json`
- Each view has a different section, e.g. the PipBoyView (`/pipboy`) has it's own key: `pipboy.*`
- When translating components, adding new strings to the appropriate section is preferred. Do not reuse strings if they are in different sections (e.g. when translating items in the TweaksView, don't use strings from `mods.*` etc.).
- Exceptions are `common.*` and `errors.*` which may be used across views. They should be used sparingly. You may add to them for very common strings, such as `OK`, `Yes`, `Not found`, `Loading...`, etc.
- Make sure that the string is translated EXACTLY as it is in the code. Do not reuse strings that are similar in meaning. Prefer to create new strings in the `*.json` files.
- Do not add file paths, file names, commands, ini sections/keys or links into translation strings. Pass them in as a variable and keep them in the code as is. Example: `<p>This tweak changes <code>fRotationSpeed</code> to <code>0.1</code>.</p>` --> `"This tweak changes the <code>{{iniKey}}</code> to <code>{{value}}</code>"`. You never know when paths (etc.) change and they should not be translated or else they may become stale.

### The Linter

- Use `pnpm lint` to find strings to translate, it'll show:
  - `warning  disallow literal string:` or
  - `warning  Unexpected 'todo' comment: 'TODO: Translate'`
    - Check TODO comments when they say something about a missing translation. They don't necessarily always say `TODO: Translate`. They may just hint at a missing translation.

### The `t` function

- Use the `t` function to get translated strings.
  - To get a string from the `*.json` files, you need to build a path to it, e.g.: `t("tweaks.accessibility.screenNarrationVoiceType")`.
  - You may include variables in strings, like so: `"screenNarrationVoiceType": "Stimmtyp {{num}}",`
  - To pass them to the `t` function, use an object as a second parameter: `t("tweaks.accessibility.screenNarrationVoiceType", { num: 2 })`
  - Use the `useTranslation` hook to get an instance of `t`: `const { t } = useTranslation();`
  - You may have to import the hook at the top of the file: `import { useTranslation } from "react-i18next";`
  - If outside of a React component or hook, you may use the global instance of `t` by importing it: `import { t } from "i18next";`
  - Prefer using the `useTranslation` hook over the global instance where possible.

### The `<Trans>` component

- If tags such as `<a href="">`, `<b>`, `<code>`, etc. are used within the string, you may have to use the `<Trans>` component. For example:

  ```tsx
  <Trans
    t={t}
    i18nKey="errors.routeNotFound"
    values={{ route: location.pathname }}
    components={{ code: <code /> }}
  />
  ```

  - The tag may be used in the string: `"routeNotFound": "Die Route <code>{{route}}</code> existiert nicht.",`
    - However, you cannot use attributes in translation strings. It is not supported by i18next.
    - If you need to use an attribute, create the component with it and pass it to the `components` prop:
    ```tsx
    <Trans
      t={t}
      i18nKey="errors.iniNotFound.text"
      components={{ a: <Link to="/profiles" /> }}
    />
    ```

- Always prefer the `t` function over the `<Trans>` component. Only use the `<Trans>` component if there are tags in the string.
