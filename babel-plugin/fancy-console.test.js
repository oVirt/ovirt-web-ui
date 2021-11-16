import * as babel from '@babel/core'
import plugin from './fancy-console.cjs'

// remove indentation from a string in a way similar to how babel does
function deindent (strings, ...keys) {
  const out = []
  strings.forEach((part, index) => {
    out.push(part.replace(/\n +/g, '\n'))
    if (keys.length > 0) {
      out.push(keys.shift())
    }
  })
  out.unshift(out.shift().replace(/^ *\n */g, ''))
  out.push(out.pop().replace(/\n *$/g, ''))
  return out.join('')
}

const SRC_TESTS = [
  [
    'log',
    `
      const foo = 1;
      const bar = {};

      console.log("just a message");
      console.log(foo);
      console.log("foo", foo);
      console.log("foo", foo, "bar", bar);
      console.log("%cFANCY%c - ", "color: red", "", foo);
    `,
  ],
  [
    'info',
    `
      const foo = 1;
      const bar = {};

      console.info('just a message');
      console.info(bar);
      console.info('bar', bar);
      console.info(\`bar: \${bar}\`);
    `,
  ],
  [
    'warn',
    `
      const foo = 1;
      const bar = {};

      console.warn('just a message');
      console.warn(bar);
      console.warn('bar', bar);
      console.warn(\`bar: \${bar}\`);
    `,
  ],
  [
    'error',
    `
      const foo = 1;
      const bar = {};

      console.error('just a message');
      console.error(bar);
      console.error('bar', bar);
      console.error(\`bar: \${bar}\`);
    `,
  ],
  [
    'group',
    `
      console.group('groupName');
      console.group('groupName, level 2');
      console.groupEnd();
      console.groupEnd();
    `,
    deindent`
      console.group('groupName');
      console.group('groupName, level 2');
      console.groupEnd();
      console.groupEnd();
    `,
  ],
]

describe('fancy-console-test', () => {
  it('deindent', () => {
    const a = 'A'
    const b = 'B'

    const src = deindent`
      ${a}
      const foo;
      something();
      {${b}}
    `

    const res = `${a}
const foo;
something();
{${b}}`

    expect(src).toMatch(res)
  })

  test.each(SRC_TESTS)(
    'test [%s]',
    (title, src, expected = '') => {
      const { code } = babel.transformSync(src, { plugins: [plugin], babelrc: false })
      expect(code).toMatchSnapshot()
      if (expected.length > 0) {
        expect(code).toMatch(expected)
      }
    }
  )

  test('custom options', () => {
    const enhancements = {
      log: ['__ debug __'],
      info: ['^^ info ^^'],
      warn: ['** warn **'],
    }

    const src = `
      con.log("this is debug");
      con.info("this in info", "data");
      con.warn("and a warning %s here", "string");
      con.error("simple error");
      con.start();
      con.start("with a string argument");
      con.stop();
      con.stop("with a string argument");
    `

    const res = deindent`
      con.log("${enhancements.log[0]}" + (" " + "this is debug"));
      con.info("${enhancements.info[0]}" + (" " + "this in info"), "data");
      con.warn("${enhancements.warn[0]}" + (" " + "and a warning %s here"), "string");
      con.error("simple error");
      con.start();
      con.start("with a string argument");
      con.stop();
      con.stop("with a string argument");
    `

    const { code } = babel.transformSync(
      src,
      {
        plugins: [
          [
            plugin,
            {
              loggers: [
                {
                  object: 'con',
                  methods: Object.keys(enhancements),
                  enhancements,
                },
              ],
            },
          ],
        ],
        babelrc: false,
      })

    expect(code).toMatch(res)
  })
})
