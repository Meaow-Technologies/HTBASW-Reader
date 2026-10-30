# Contributing

Corrections to chapter text and improvements to the reader are welcome.

## Chapter corrections

Edit the relevant file in `chapters/first/`. Keep the filename, title, and
allowed XHTML elements intact. Escape literal ampersands as `&amp;` and do not
add scripts, links, or custom attributes to chapter files.

## Website changes

Run the focused checks before opening a pull request:

```sh
python3 -m unittest discover -s tests -v
python3 scripts/build.py
```

Generated files in `dist/` are build output and should not be edited manually.
