const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '../note');

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Note API',
        desc: 'API for creating and retrieving notes',
        example_url: [
            { method: 'GET', query: '/note/:UUID', desc: 'Retrieve a note' },
            { method: 'PUT', query: '/note/:UUID', desc: 'Create or update a note' }
        ]
    },
    methods: {
        get: (req, res) => {
            const uuid = req.params.UUID;

            if (!uuid || uuid === ':UUID' || uuid.length > 36) {
                res.redirect(`./${require('uuid').v4()}`);
                return;
            }

            const filePath = path.join(notesDir, `${uuid}.txt`);
            const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

            if (fs.existsSync(filePath + '.raw')) {
                const rawFilePath = fs.readFileSync(filePath + '.raw', 'utf8');
                
                if (fs.existsSync(rawFilePath)) {
                    res.set('content-type', 'text/plain');
                    res.end(fs.readFileSync(rawFilePath, 'utf8'));
                    return;
                } else {
                    res.status(404).end();
                    return;
                }
            }

            if (req.query.raw == 'true' || !/^Mozilla/.test(req.headers['user-agent'])) {
                res.set('content-type', 'text/plain');
                res.end(text);
                return;
            }

            res.set('content-type', 'text/html');
            res.end(`<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f9f6ef;
        }

        #content {
            width: 100%;
            height: 100vh;
            overflow: scroll;
            border-top: 1px solid #333;
        }

        #content div {
            display: flex;
            min-height: 100%;
            height: auto;
        }

        #content .lines {
            color: red;
            padding: 4px;
            font-size: 10px;
            text-align: right;
            margin: 1px;
            border-right: 1px solid #333;
        }

        #content textarea {
            width: 100%;
            padding: 4px 8px;
            border: none;
            font-size: 10px;
            resize: none;
            outline: none;
            background-color: #f9f6ef;
            white-space: pre;
        }
    </style>
</head>
<body>
    <h3>Note By NinoKawai</h3>
    <h6>Sau khi chỉnh sửa thay đổi hãy đợi 1s để upload data</h6>
    <div id="content">
        <div>
            <div class="lines">1</div>
            <textarea placeholder="..."></textarea>
        </div>
    </div>
    <script>
        const textarea = document.querySelector('#content textarea');
        const lines = document.querySelector('#content .lines');

        const update_lines = (thiss, texts = textarea.value.split('\\n')) => {
            if (texts.length === 1 || texts.length !== lines.innerHTML.split('<br>').length) {
                lines.innerHTML = texts.map((e, i) => (i + 1)).join('<br>');
            }
        };

        const put = _ => fetch(location.href, {
            method: 'PUT',
            headers: {
                'content-type': 'text/plain; charset=utf-8',
            },
            body: textarea.value,
        });

        let putt;
        const u = new URL(location.href);
        u.searchParams.append('raw', 'true');

        fetch(u.href, { method: 'GET', headers: { 'user-agent': 'fetch' } })
            .then(r => r.text())
            .then(t => {
                textarea.value = t;
                update_lines();
                textarea.addEventListener('input', function () {
                    if (putt) clearTimeout(putt);
                    putt = setTimeout(put, 1000);
                    update_lines();
                });
            });
    </script>
</body>
</html>
`)
        },
        put: async (req, res) => {
            const chunks = [];

            req.on('data', chunk => chunks.push(chunk));
            await new Promise(resolve => req.on('end', resolve));

            const uuid = req.params.UUID;
            const filePath = path.join(notesDir, `${uuid}.txt`);

            if (req.query.raw) {
                if (!fs.existsSync(filePath + '.raw')) {
                    fs.writeFileSync(filePath + '.raw', path.join(notesDir, `${req.query.raw}.txt`));
                }
            } else {
                fs.writeFileSync(filePath, Buffer.concat(chunks));
            }

            res.end();
        },
    },
};