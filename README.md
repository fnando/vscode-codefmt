# Code Formatter for VSCode

A plugin that allows applying code formatting with minimum configuration.

Includes support for running the following formatters:

- [Ruby’s RuboCop](https://rubocop.org)
- [Ruby’s rubyfmt](https://github.com/penelopezone/rubyfmt)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Golang’s gofmt](https://pkg.go.dev/cmd/gofmt)
- [Golang’s goimports](https://pkg.go.dev/golang.org/x/tools/cmd/goimports)
- [Python’s autopep8](https://pypi.org/project/autopep8/)
- [Python’s yapf](https://pypi.org/project/yapf/)
- [PHP Code Standards Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer)
- [Rust’s rustfmt](https://github.com/rust-lang/rustfmt)
- [SVGO](https://github.com/svg/svgo)
- [Flutter](https://flutter.dev/)
- [Dart’s dartfmt](https://dart.dev/tools/dartfmt)

## Usage

By default, files are formatted on save. You can disable this behavior by going
to VSCode settings and searching for "Codefmt". There your can disable on save
formatting, as well as enabling the debug mode.

To format files individually, you can use the Command Pallette and search for
"Codefmt".

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
