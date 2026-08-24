// =====================================================
// KLM MINGGUAN
// =====================================================

console.log("KLM MINGGUAN JS READY");

let db = null;

let pengguna = null;

let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";


// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("KLM MINGGUAN: INIT");

    db = window.supabaseClient;

    if (!db) {
        console.error("Supabase client tidak dijumpai.");
        paparStatus(
            "Supabase tidak berjaya disambungkan.",
            true
        );
        return;
    }

    binaTahun();

    tetapkanBulanSemasa();

    pasangEvent();

    await dapatkanPengguna();

    await muatAnggota();

    await muatDataMinggu();

});


// =====================================================
// TAHUN
// =====================================================

function binaTahun() {

    const select = document.getElementById("tahun");

    const tahunSekarang =
        new Date().getFullYear();

    for (
        let tahun = tahunSekarang - 2;
        tahun <= tahunSekarang + 2;
        tahun++
    ) {

        const option =
            document.createElement("option");

        option.value = tahun;

        option.textContent = tahun;

        if (tahun === tahunSekarang) {
            option.selected = true;
        }

        select.appendChild(option);
    }

}


// =====================================================
// BULAN
// =====================================================

function tetapkanBulanSemasa() {

    const bulan =
        new Date().getMonth() + 1;

    document.getElementById("bulan").value =
        bulan;

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(".week-tab")
                        .forEach(t =>
                            t.classList.remove("active")
                        );

                    tab.classList.add("active");

                    mingguSemasa =
                        tab.dataset.minggu;

                    document
                        .getElementById(
                            "mingguSemasaText"
                        )
                        .textContent =
                        mingguSemasa;

                    await muatDataMinggu();

                }
            );

        });


    document
        .getElementById("bulan")
        .addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );


    document
        .getElementById("tahun")
        .addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );


    document
        .getElementById("btnSimpan")
        .addEventListener(
            "click",
            simpanMinggu
        );


    const btnLogout =
        document.getElementById("btnLogout");

    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            async () => {

                if (db) {
                    await db.auth.signOut();
                }

                window.location.href =
                    "login.html";

            }
        );

    }

}


// =====================================================
// PENGGUNA
// =====================================================

async function dapatkanPengguna() {

    try {

        const {
            data: {
                user
            }
        } = await db.auth.getUser();

        if (!user) {

            console.warn(
                "Tiada pengguna login."
            );

            return;
        }


        pengguna = user;


        /*
         * auth-guard anda mungkin mempunyai
         * nama pengguna di metadata.
         */

        const nama =
            user.user_metadata?.nama ||
            user.user_metadata?.full_name ||
            user.email ||
            "";


        document
            .getElementById("namaPengguna")
            .textContent = nama;

        document
            .getElementById("namaPenggunaSidebar")
            .textContent = nama;


        console.log(
            "PENGGUNA LOGIN:",
            nama
        );

    } catch (error) {

        console.error(
            "RALAT PENGGUNA:",
            error
        );

    }

}


// =====================================================
// MUAT ANGGOTA
// =====================================================

async function muatAnggota() {

    paparLoading(true);

    try {

        /*
         * Kita cari semua anggota dahulu.
         *
         * Ketua Unit akan ditentukan melalui
         * Data_Anggota.ketua_unit.
         */

        const {
            data,
            error
        } = await db
            .from("Data_Anggota")
            .select(`
                noskb,
                noanggota,
                nama,
                poskhidmat,
                unit,
                ketua_unit,
                status
            `)
            .order("poskhidmat", {
                ascending: true
            })
            .order("nama", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        anggota = data || [];


        console.log(
            "DATA ANGGOTA:",
            anggota.length
        );


        tentukanKetuaUnit();

        paparAnggota();

    } catch (error) {

        console.error(
            "RALAT MUAT ANGGOTA:",
            error
        );

        paparStatus(
            "Gagal memuatkan Data_Anggota: " +
            error.message,
            true
        );

    } finally {

        paparLoading(false);

    }

}


// =====================================================
// TENTUKAN KETUA UNIT
// =====================================================

function tentukanKetuaUnit() {

    if (!pengguna || !anggota.length) {
        return;
    }


    const namaLogin =
        (
            pengguna.user_metadata?.nama ||
            pengguna.user_metadata?.full_name ||
            ""
        )
        .trim()
        .toLowerCase();


    /*
     * Cari rekod anggota yang mempunyai
     * ketua_unit sama dengan nama pengguna.
     */

    let rekodKetua =
        anggota.find(a => {

            const ketua =
                (a.ketua_unit || "")
                .trim()
                .toLowerCase();

            return ketua === namaLogin;

        });


    /*
     * Jika metadata nama tidak sama,
     * cuba padankan email.
     */

    if (!rekodKetua && pengguna.email) {

        const emailNama =
            pengguna.email
                .split("@")[0]
                .replace(/[._-]/g, " ")
                .trim()
                .toLowerCase();


        rekodKetua =
            anggota.find(a => {

                const ketua =
                    (a.ketua_unit || "")
                    .trim()
                    .toLowerCase();

                return ketua === emailNama;

            });

    }


    if (rekodKetua) {

        const namaKetua =
            rekodKetua.ketua_unit;

        const unit =
            rekodKetua.unit;


        document
            .getElementById("paparKetuaUnit")
            .textContent =
            namaKetua || "-";


        document
            .getElementById("paparUnit")
            .textContent =
            unit || "-";


        document
            .getElementById("unitPengguna")
            .textContent =
            unit || "-";


        document
            .getElementById("unitPenggunaSidebar")
            .textContent =
            unit || "-";


        /*
         * Tapis hanya anggota Ketua Unit.
         */

        anggota =
            anggota.filter(a => {

                const ketua =
                    (a.ketua_unit || "")
                    .trim()
                    .toLowerCase();

                return ketua ===
                    namaKetua
                    .trim()
                    .toLowerCase();

            });


        console.log(
            "KETUA UNIT:",
            namaKetua
        );

        console.log(
            "UNIT:",
            unit
        );

        console.log(
            "ANGGOTA KETUA UNIT:",
            anggota.length
        );

    } else {

        console.warn(
            "Rekod Ketua Unit tidak ditemui."
        );

        paparStatus(
            "Ketua Unit login tidak ditemui dalam Data_Anggota.ketua_unit.",
            true
        );

    }

}


// =====================================================
// PAPAR ANGGOTA
// =====================================================

function paparAnggota() {

    const container =
        document.getElementById("senaraiPos");


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `
            <div class="card">
                <strong>Tiada anggota.</strong>
                <p>
                    Tiada anggota dijumpai di bawah
                    Ketua Unit ini.
                </p>
            </div>
        `;

        return;
    }


    /*
     * GROUP IKUT POS
     */

    const kumpulan = {};


    anggota.forEach(a => {

        const pos =
            a.poskhidmat ||
            "POS TIDAK DITETAPKAN";


        if (!kumpulan[pos]) {
            kumpulan[pos] = [];
        }

        kumpulan[pos].push(a);

    });


    let bilPos = 0;


    Object.entries(kumpulan)
        .forEach(([pos, senarai]) => {

            bilPos++;


            const card =
                document.createElement("div");

            card.className =
                "pos-card";


            const header =
                document.createElement("div");

            header.className =
                "pos-header";

            header.textContent =
                pos;


            const wrapper =
                document.createElement("div");

            wrapper.className =
                "table-wrapper";


            const table =
                document.createElement("table");

            table.className =
                "klm-table";


            table.innerHTML = `
                <thead>

                    <tr>

                        <th rowspan="2"
                            class="col-bil">
                            BIL
                        </th>

                        <th rowspan="2"
                            class="col-skb">
                            NO SKB
                        </th>

                        <th rowspan="2"
                            class="col-anggota">
                            NO ANGGOTA
                        </th>

                        <th rowspan="2"
                            class="col-nama">
                            NAMA ANGGOTA
                        </th>

                        <th rowspan="2">
                            HARI BIASA
                            <br>
                            <small>JAM</small>
                        </th>

                        <th colspan="3">
                            HARI OFF
                        </th>

                        <th colspan="2">
                            HARI CUTI AM
                        </th>

                    </tr>

                    <tr>

                        <th>
                            KURANG
                            <br>
                            4 JAM
                        </th>

                        <th>
                            KURANG
                            <br>
                            8 JAM
                        </th>

                        <th>
                            LEBIH
                            <br>
                            8 JAM
                        </th>

                        <th>
                            KURANG
                            <br>
                            8 JAM
                        </th>

                        <th>
                            LEBIH
                            <br>
                            8 JAM
                        </th>

                    </tr>

                </thead>

                <tbody></tbody>
            `;


            const tbody =
                table.querySelector("tbody");


            senarai.forEach(
                (a, index) => {

                    const tr =
                        document.createElement("tr");


                    tr.dataset.noskb =
                        a.noskb;


                    tr.innerHTML = `

                        <td class="col-bil">
                            ${index + 1}
                        </td>

                        <td class="col-skb">
                            ${a.noskb ?? ""}
                        </td>

                        <td>
                            ${a.noanggota ?? ""}
                        </td>

                        <td class="col-nama">
                            ${escapeHtml(
                                a.nama || ""
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "hari_biasa_jam",
                                a.noskb
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "off_kurang_4",
                                a.noskb
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "off_kurang_8",
                                a.noskb
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "off_lebih_8",
                                a.noskb
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "cuti_kurang_8",
                                a.noskb
                            )}
                        </td>

                        <td>
                            ${inputKLM(
                                "cuti_lebih_8",
                                a.noskb
                            )}
                        </td>

                    `;


                    tbody.appendChild(tr);

                }
            );


            wrapper.appendChild(table);

            card.appendChild(header);

            card.appendChild(wrapper);

            container.appendChild(card);

        });

}


// =====================================================
// INPUT
// =====================================================

function inputKLM(field, noskb) {

    return `
        <input
            type="number"
            min="0"
            step="0.01"
            class="input-klm"
            data-field="${field}"
            data-noskb="${noskb}"
            value="0"
        >
    `;

}


// =====================================================
// MUAT DATA MINGGU
// =====================================================

async function muatDataMinggu() {

    if (!anggota.length) {
        return;
    }


    const bulan =
        Number(
            document.getElementById("bulan").value
        );


    const tahun =
        Number(
            document.getElementById("tahun").value
        );


    paparLoading(true);


    try {

        const {
            data,
            error
        } = await db
            .from("KLM_Mingguan")
            .select("*")
            .eq("bulan", bulan)
            .eq("tahun", tahun)
            .eq("minggu", mingguSemasa);


        if (error) {
            throw error;
        }


        dataKLM = data || [];


        console.log(
            mingguSemasa,
            "DATA KLM:",
            dataKLM.length
        );


        paparAnggota();

        isiDataKeInput();


    } catch (error) {

        console.error(
            "RALAT MUAT KLM:",
            error
        );

        /*
         * Jika table belum wujud,
         * paparkan senarai anggota dahulu.
         */

        paparAnggota();

        paparStatus(
            "Data KLM belum dapat dimuatkan: " +
            error.message,
            true
        );

    } finally {

        paparLoading(false);

    }

}


// =====================================================
// ISI DATA DB KE INPUT
// =====================================================

function isiDataKeInput() {

    dataKLM.forEach(row => {

        const inputs =
            document.querySelectorAll(
                `.input-klm[data-noskb="${row.noskb}"]`
            );


        inputs.forEach(input => {

            const field =
                input.dataset.field;


            if (
                row[field] !== null &&
                row[field] !== undefined
            ) {

                input.value =
                    row[field];

            }

        });

    });

}


// =====================================================
// SIMPAN
// =====================================================

async function simpanMinggu() {

    if (!anggota.length) {

        alert(
            "Tiada anggota untuk disimpan."
        );

        return;
    }


    const bulan =
        Number(
            document.getElementById("bulan").value
        );


    const tahun =
        Number(
            document.getElementById("tahun").value
        );


    const unit =
        document
            .getElementById("paparUnit")
            .textContent
            .trim();


    const ketuaUnit =
        document
            .getElementById("paparKetuaUnit")
            .textContent
            .trim();


    const btn =
        document.getElementById("btnSimpan");


    btn.disabled = true;

    btn.textContent =
        "⏳ MENYIMPAN...";


    try {

        const rows = [];


        anggota.forEach(a => {

            const inputs =
                document.querySelectorAll(
                    `.input-klm[data-noskb="${a.noskb}"]`
                );


            const values = {};


            inputs.forEach(input => {

                values[
                    input.dataset.field
                ] =
                    Number(input.value || 0);

            });


            rows.push({

                bulan,

                tahun,

                minggu:
                    mingguSemasa,

                unit,

                poskhidmat:
                    a.poskhidmat,

                noskb:
                    a.noskb,

                noanggota:
                    a.noanggota,

                nama:
                    a.nama,

                hari_biasa_jam:
                    values.hari_biasa_jam || 0,

                off_kurang_4:
                    values.off_kurang_4 || 0,

                off_kurang_8:
                    values.off_kurang_8 || 0,

                off_lebih_8:
                    values.off_lebih_8 || 0,

                cuti_kurang_8:
                    values.cuti_kurang_8 || 0,

                cuti_lebih_8:
                    values.cuti_lebih_8 || 0,

                ketua_unit:
                    ketuaUnit,

                updated_at:
                    new Date().toISOString()

            });

        });


        const {
            error
        } = await db
            .from("KLM_Mingguan")
            .upsert(
                rows,
                {
                    onConflict:
                        "bulan,tahun,minggu,noskb"
                }
            );


        if (error) {
            throw error;
        }


        paparStatus(
            `Berjaya simpan ${mingguSemasa}.`
        );


        btn.textContent =
            "✅ BERJAYA DISIMPAN";


        setTimeout(() => {

            btn.textContent =
                "💾 SIMPAN MINGGU";

        }, 2000);


    } catch (error) {

        console.error(
            "RALAT SIMPAN:",
            error
        );


        paparStatus(
            "Gagal menyimpan: " +
            error.message,
            true
        );


        btn.textContent =
            "❌ GAGAL SIMPAN";


    } finally {

        btn.disabled = false;

    }

}


// =====================================================
// STATUS
// =====================================================

function paparStatus(
    message,
    error = false
) {

    const box =
        document.getElementById("statusBox");


    box.textContent =
        message;


    box.classList.remove(
        "hidden",
        "error"
    );


    if (error) {
        box.classList.add("error");
    }


    setTimeout(() => {

        box.classList.add("hidden");

    }, 5000);

}


// =====================================================
// LOADING
// =====================================================

function paparLoading(show) {

    const box =
        document.getElementById(
            "loadingBox"
        );


    if (show) {
        box.classList.remove("hidden");
    } else {
        box.classList.add("hidden");
    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
