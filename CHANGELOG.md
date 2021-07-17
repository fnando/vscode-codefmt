# Change Log

All notable changes to the "codefmt" extension will be documented in this file.

## v0.0.6

- Set proper extension category.

## v0.0.5

- Formatter languages will be matched against a regex now (e.g `ruby` will be
  matched against `^ruby(-[a-z0-9]+)*$`. This allows formatting language
  extensions, like `ruby-bundler`.

## v0.0.4

- Add support for commands that emits to stdout but cannot save to file.
- Add jq formatter that sorts JSON keys.

## v0.0.3

- Add support for formatters customization.
- Add gofumpt support (also set it as the default formatter).

## v0.0.2

- Add icon.

## v0.0.1

- Fix args replacement when debug mode was disabled.

## v0.0.0

- Initial release
