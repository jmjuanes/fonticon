const fs = require("node:fs/promises");
const path = require("node:path");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
const runtime = require("react/jsx-runtime");
const matter = require("gray-matter");
const hljs = require("highlight.js/lib/common");

const pkg = require("../package.json");
const icons = require("../icons.json");

const importPackages = () => {
    return Promise.all([
        import("@mdx-js/mdx"),
    ]);
};

// Generate build info
const getBuildInfo = () => {
    const now = new Date();
    // Use Intl.DateFileFormat to generate build time
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
    const dateTimeOptions = {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "CET",
    };
    // Return build info
    return {
        time: {
            formatted: new Intl.DateTimeFormat("en-US", dateTimeOptions).format(now),
        },
    };
};

const Icon = props => (
    <svg xmlns="http-//www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
        <path d={icons[props.icon].path} fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CodeBlock = props => {
    const className = "p-4 rounded-md bg-gray-900 text-white overflow-auto mb-8 text-sm font-mono";
    if (props.language) {
        return React.createElement("pre", {
            className: className,
            dangerouslySetInnerHTML: {
                __html: hljs.highlight(props.children, {language: props.language}).value,
            },
        });
    }
    // Default: render without code highlight
    return (
        <pre className={className}>{props.children}</pre>
    );
};

const pageComponents = {
    "h1": props => <h1 className="mt-8 mb-4 text-gray-800 text-2xl font-bold">{props.children}</h1>,
    "h2": props => <h2 className="mt-8 mb-4 text-gray-800 text-xl font-bold">{props.children}</h2>,
    "p": props => <p className="mt-6 mb-6">{props.children}</p>,
    "code": props => <code className="font-bold text-sm font-mono">{`'`}{props.children}{`'`}</code>,
    Icon: props => <Icon {...props} />,
    CodeBlock: CodeBlock,
    Fragment: React.Fragment,
};

const PageWrapper = props => (
    <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
            <meta name="title" content="josemi/icons" />
            <meta name="description" content="Enhance your projects with beautifully crafted SVG icons." />
            <meta property="og:site_name" content="josemi/icons" />
            <meta property="og:title" content="josemi/icons" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://icons.josemi.xyz" />
            <meta property="og:image" content="https://icons.josemi.xyz/og.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="josemi/icons" />
            <meta property="description" content="Enhance your projects with beautifully crafted SVG icons." />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:author" content="@jmjuanes" />
            <meta name="twitter:title" content="josemi/icons" />
            <meta name="twitter:description" content="Enhance your projects with beautifully crafted SVG icons." />
            <meta name="twitter:image" content="https://icons.josemi.xyz/og.png" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" />
            <link rel="stylesheet" href="./low.css" />
            <link rel="stylesheet" href="./highlight.css" />
            <title>{`${props?.page?.data?.title ? `${props.page.data.title} - ` : ""} josemi/icons ${pkg.version}`}</title>
        </head>
        <body className="bg-white m-0 p-0 font-inter text-gray-800 leading-normal">
            {/* Header */}
            <div className="border-b-1 border-gray-300 relative">
                <div className="w-full maxw-7xl h-20 px-6 mx-auto flex items-center justify-between">
                    <a href="./index.html" className="flex items-center gap-2 text-gray-800 no-underline">
                        <div className="font-bold flex items-center">
                            <span>josemi/</span>
                            <span className="text-gray-500">icons</span>
                        </div>
                        <div className="flex items-center font-bold text-2xs bg-gray-200 px-2 py-1 rounded-lg">
                            <span>v{pkg.version}</span>
                        </div>
                    </a>
                    <div className="flex flex-row gap-6 items-center">
                        <a href={pkg.repository} className="no-underline o-70 hover:o-100">
                            <img className="w-6 h-6" src="./github.svg" />
                        </a>
                    </div>
                </div>
            </div>
            {/* Main content */}
            <div className="w-full maxw-7xl mx-auto px-6">
                {props.page.element}
            </div>
            {/* Footer */}
            <div className="w-full maxw-7xl mx-auto px-6 pt-10 pb-20">
                <div className="mb-12 border-t-1 border-gray-300" />
                <div className="text-center text-sm mb-2">
                    Designed by <a href="https://josemi.xyz" className="no-underline text-gray-800 hover:text-gray-700 font-bold">Josemi</a>. 
                    The source code is available on <a href={pkg.repository.url} className="no-underline text-gray-800 hover:text-gray-700 font-bold">GitHub</a>.
                </div>
                <div className="text-center text-sm">
                    <div>Last built on {props.buildInfo.time.formatted}.</div>
                </div>
            </div>
        </body>
    </html>
);

const readMarkdownFile = (folder, file) => {
    const filePath = path.join(folder, file);
    return fs.readFile(filePath, "utf8").then(fileContent => {
        const {data, content} = matter(fileContent);
        return {
            data: data,
            content: content,
            fileName: path.basename(file, ".mdx") + ".html",
        };
    });
};

importPackages().then(pkgs => {
    const [mdx] = pkgs;
    const buildInfo = getBuildInfo();
    const inputFolder = path.join(process.cwd(), "pages");
    const outputFolder = path.join(process.cwd(), "www");
    const log = msg => console.log(`[docs] ${msg}`);
    log("Starting build...");
    log("Reading .mdx files from 'pages/' folder.");
    fs.readdir(inputFolder)
        .then(files => files.filter(file => path.extname(file) === ".mdx"))
        .then(files => {
            log(`Processing ${files.length} files.`);
            return Promise.all(files.map(file => {
                return readMarkdownFile(inputFolder, file);
            }));
        })
        .then(pages => {
            const templatePage = pages.find(page => page.fileName.startsWith("["));
            const iconsPages = Object.keys(icons).map(icon => ({
                data: {
                    ...templatePage.data,
                    title: icon,
                    icon: icons[icon],
                },
                content: templatePage.content,
                fileName: `${icon}.html`,
            }));
            return [
                ...pages.filter(page => !page.fileName.startsWith("[")),
                ...iconsPages,
            ];
        })
        .then(async pages => {
            const buildPromises = pages.map(page => {
                return mdx.evaluate(page.content, {...runtime})
                    .then(pageComponent => {
                        const pageContent = React.createElement(PageWrapper, {
                            page: {
                                ...page,
                                element: React.createElement(pageComponent.default, {
                                    page: page,
                                    components: pageComponents,
                                    icons: Object.values(icons),
                                    version: pkg.version,
                                    repository: pkg.repository.url,
                                    downloadUrl: `${pkg.repository.url}/releases/download/v${pkg.version}/icons.zip`,
                                }),
                            },
                            pages: pages,
                            buildInfo: buildInfo,
                        });
                        return renderToStaticMarkup(pageContent);
                    })
                    .then(content => {
                        return fs.writeFile(path.join(outputFolder, page.fileName), content, "utf8");
                    })
                    .then(() => {
                        log(`Saved file to 'www/${page.fileName}'.`);
                    });
            });
            return Promise.all(buildPromises);
        })
        .then(() => log("Build finished."));
});
