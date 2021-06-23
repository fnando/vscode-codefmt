# Code Formatter for VSCode

A plugin that allows applying code formatting with minimum configuration.

Includes support for running the following formatters:

- [Ruby’s RuboCop](https://rubocop.org)
- [Ruby’s rubyfmt](https://github.com/penelopezone/rubyfmt)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Golang’s gofmt](https://pkg.go.dev/cmd/gofmt)
- [Golang’s goimports](https://pkg.go.dev/golang.org/x/tools/cmd/goimports)
- [Golang’s gofumpt](https://pkg.go.dev/mvdan.cc/gofumpt)
- [Python’s autopep8](https://pypi.org/project/autopep8/)
- [Python’s yapf](https://pypi.org/project/yapf/)
- [PHP Code Standards Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer)
- [Rust’s rustfmt](https://github.com/rust-lang/rustfmt)
- [SVGO](https://github.com/svg/svgo)
- [Flutter](https://flutter.dev/)
- [Dart’s dartfmt](https://dart.dev/tools/dartfmt)
- [jq](https://stedolan.github.io/jq/)

## Usage

By default, files are formatted on save. You can disable this behavior by going
to VSCode settings and searching for "Codefmt". There your can disable on save
formatting, as well as enabling the debug mode.

To format files individually, you can use the Command Pallette and search for
"Codefmt".

By default, the following formatters will be used:

```json
[
  "gofumpt",
  "rubocop",
  "prettier",
  "eslint",
  "jq",
  "php-cs-fixer",
  "rustfmt",
  "svgo",
  "swiftformat",
  "flutter",
  "yapf"
]
```

You can change the default formatters by changing the setting
`codefmt.preferredFormatters`. It's a array of strings. You must set the whole
list if you want to change any of the items.

The following example uses `rubyfmt` instead of `rubocop`.

```json
{
  "codefmt.preferredFormatters": [
    "gofumpt",
    "rubyfmt",
    "jq",
    "prettier",
    "eslint",
    "php-cs-fixer",
    "rustfmt",
    "svgo",
    "swiftformat",
    "flutter",
    "yapf"
  ]
}
```

**Attention:**: The preferred formatters list order is important: formatters run
from top to down.

To add new formatters, or change the arguments used by an existing format, use
the `codefmt.formatters` setting. You can set only the commands you want; no
need to retype every single command that's used by default. If this is a new
formatter, then remember to also add it to `codefmt.preferredFormatters`.

The following example replaces the existing `rubocop` formatter to use
`--auto-correct` instead of `--auto-correct-all`:

```json
{
  "codefmt.formatters": {
    "rubocop": {
      "command": [
        "rubocop",
        "$debug",
        "--auto-correct",
        "--config",
        "$config",
        "$file"
      ],
      "languages": ["ruby"],
      "debug": ["--debug", "--extra-details"],
      "defaultConfig": null,
      "configFiles": [".rubocop.yml"],
      "useStdout": false
    }
  }
}
```

Notice that a formatter command may use any of this placeholders:

- `$debug`: the position where the arguments for debugging will be inserted.
- `$config`: the position where the config file must be inserted.
- `$file`: the position where the file path must be inserted.

For commands that output the formatted file to stdout, you can use `useStdout`.
The requirement is that commands must exit(0). This is the default
[jq](https://stedolan.github.io/jq/) formatter for JSON files, which sorts keys.

```json
{
  "jq": {
    "command": ["jq", "--sort-keys", ".", "$file"],
    "languages": ["json"],
    "debug": [],
    "configFiles": [],
    "useStdout": true
  }
}
```

## License

Copyright (c) 2021 Nando Vieira

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
