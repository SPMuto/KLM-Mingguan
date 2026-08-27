console.log("=================================");
console.log("KLM RM JS READY");
console.log("=================================");


let db = null;

let pengguna = null;

let profilKetuaUnit = null;

let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";


// =====================================================
// INIT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("KLM RM: INIT");

        db = window.supabaseClient;

        if (!db) {

            paparStatus(
                "❌ Supabase tidak berjaya disambungkan.",
                true
            );

            return;
        }


        binaTahun();

        tetapkanBulanSemasa();

        pasangEvent();


        const berjaya =
            await dapatkanPengguna();


        if (!berjaya) {
            return;
        }


        await muatAnggota();

        await muatDataRM();

    }
);


// =====================================================
// TAHUN
// =====================================================

function binaTahun() {

    const select =
        document.getElementById("tahun");

    if (!select) return;


    select.innerHTML = "";


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


    const select =
        document.getElementById("bulan");


    if (select) {

        select.value = bulan;

    }

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {


    // =================================================
    // MINGGU
    // =================================================

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async () => {

                    const mingguBaru =
                        tab.dataset.minggu;


                    if (
                        mingguBaru ===
                        mingguSemasa
                    ) {

                        return;

                    }


                    document
                        .querySelectorAll(
                            ".week-tab"
                        )
                        .forEach(t => {

                            t.classList
                                .remove(
                                    "active"
                                );

                        });


                    tab.classList
                        .add("active");


                    mingguSemasa =
                        mingguBaru;


                    setText(
                        "mingguSemasaText",
                        mingguSemasa
                    );


                    await muatDataRM();

                }

            );

        });


    // =================================================
    // BULAN
    // =================================================

    const bulan =
        document.getElementById("bulan");


    if (bulan) {

        bulan.addEventListener(
            "change",
            muatDataRM
        );

    }


    // =================================================
    // TAHUN
    // =================================================

    const tahun =
        document.getElementById("tahun");


    if (tahun) {

        tahun.addEventListener(
            "change",
            muatDataRM
        );

    }


    // =================================================
    // KIRA
    // =================================================

    const btnKira =
        document.getElementById("btnKira");


    if (btnKira) {

        btnKira.addEventListener(
            "click",
            () => {

                console.log(
                    "🧮 BUTANG KIRA RM DITEKAN"
                );

                kiraSemuaRM();

            }
        );

    }


    // =================================================
    // SIMPAN
    // =================================================

    const btnSimpan =
        document.getElementById("btnSimpan");


    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanRM
        );

    }


    // =================================================
    // CSV
    // =================================================

    const btnCSV =
        document.getElementById("btnCSV");


    if (btnCSV) {

        btnCSV.addEventListener(
            "click",
            exportCSV
        );

    }


    // =================================================
    // LOGOUT
    // =================================================

    const btnLogout =
        document.getElementById("btnLogout");


    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            async () => {

                await db.auth.signOut();

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
            data,
            error
        } =
        await db.auth.getUser();


        if (error) {
            throw error;
        }


        pengguna =
            data?.user;


        if (!pengguna) {

            window.location.href =
                "login.html";

            return false;

        }


        const email =
            (pengguna.email || "")
                .trim()
                .toLowerCase();


        const {
            data: profil,
            error: profilError
        } =
        await db
            .from("pengguna_ketua_unit")
            .select(`
                id,
                user_id,
                email,
                nama,
                unit,
                role,
                status
            `)
            .eq("email", email)
            .eq("status", "Aktif")
            .maybeSingle();


        if (profilError) {
            throw profilError;
        }


        if (!profil) {

            paparStatus(
                "❌ Email ini belum didaftarkan sebagai Ketua Unit.",
                true
            );

            return false;

        }


        profilKetuaUnit =
            profil;


        window.ketuaUnitLogin =
            profilKetuaUnit;


        // =================================================
        // PAPAR USER
        // =================================================

        setText(
            "namaPengguna",
            profil.nama
        );


        setText(
            "namaPenggunaSidebar",
            profil.nama
        );


        setText(
            "unitPengguna",
            profil.unit
        );


        setText(
            "unitPenggunaSidebar",
            profil.unit
        );


        setText(
            "paparKetuaUnit",
            profil.nama
        );


        setText(
            "paparUnit",
            profil.unit
        );


        return true;


    } catch (error) {

        console.error(
            "RALAT PENGGUNA:",
            error
        );


        paparStatus(
            "❌ Gagal mendapatkan pengguna: " +
            error.message,
            true
        );


        return false;

    }

}


// =====================================================
// MUAT ANGGOTA + KADAR RM
// =====================================================

async function muatAnggota() {

    try {

        const unit =
            (profilKetuaUnit.unit || "")
                .trim();


        const {
            data,
            error
        } =
        await db
            .from("Data_Anggota")
            .select(`
                noskb,
                noanggota,
                nama,
                poskhidmat,
                unit,
                jawatan,
                status,

                rm_pehariklmbiasa,
                rm_perharioffday,
                rm_perjamoffday,
                rm_perharicutiam,
                rm_perjamcutiam
            `)
            .eq("unit", unit)
            .eq("status", "Aktif")
            .order(
                "poskhidmat",
                {
                    ascending: true
                }
            )
            .order(
                "nama",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        anggota =
            data || [];


        console.log(
            "JUMLAH ANGGOTA:",
            anggota.length
        );


    } catch (error) {

        console.error(
            "RALAT ANGGOTA:",
            error
        );


        paparStatus(
            "❌ Gagal memuat anggota: " +
            error.message,
            true
        );

    }

}


// =====================================================
// MUAT DATA KLM
// =====================================================

async function muatDataRM() {

    if (!profilKetuaUnit) {
        return;
    }


    paparLoading(true);


    try {

        const bulan =
            Number(
                document.getElementById(
                    "bulan"
                ).value
            );


        const tahun =
            Number(
                document.getElementById(
                    "tahun"
                ).value
            );


        const unit =
            (profilKetuaUnit.unit || "")
                .trim();


        console.log(
            "================================="
        );

        console.log(
            "MUAT DATA KLM UNTUK RM"
        );

        console.log(
            "BULAN:",
            bulan
        );

        console.log(
            "TAHUN:",
            tahun
        );

        console.log(
            "MINGGU:",
            mingguSemasa
        );

        console.log(
            "UNIT:",
            unit
        );

        console.log(
            "================================="
        );


        const {
            data,
            error
        } =
        await db
            .from("KLM_Mingguan")
            .select("*")
            .eq("bulan", bulan)
            .eq("tahun", tahun)
            .eq("minggu", mingguSemasa)
            .eq("unit", unit);


        if (error) {
            throw error;
        }


        dataKLM =
            data || [];


        console.log(
            "✅ DATA KLM:",
            dataKLM.length
        );


        // =================================================
        // PAPAR
        // =================================================

        paparJadual();


        // =================================================
        // TERUS KIRA
        // =================================================

        if (dataKLM.length > 0) {

            kiraSemuaRM();

        }


    } catch (error) {

        console.error(
            "❌ RALAT MUAT DATA KLM:",
            error
        );


        dataKLM = [];


        paparJadual();


        paparStatus(
            "❌ Gagal memuat data KLM: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// PAPAR JADUAL
// =====================================================

function paparJadual() {

    const container =
        document.getElementById(
            "senaraiPos"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `
            <div class="card">
                <strong>Tiada anggota.</strong>
            </div>
        `;

        return;

    }


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


    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-card";


                card.innerHTML = `

                    <div class="pos-header">

                        📍 ${escapeHtml(pos)}

                        <small>
                            ${senarai.length}
                            anggota
                        </small>

                    </div>

                    <div class="table-wrapper">

                        <table class="klm-table">

                            <thead>

                                <tr>

                                    <th rowspan="2">
                                        BIL
                                    </th>

                                    <th rowspan="2">
                                        NO SKB
                                    </th>

                                    <th rowspan="2">
                                        NO ANGGOTA
                                    </th>

                                    <th rowspan="2">
                                        NAMA ANGGOTA
                                    </th>

                                    <th colspan="2">
                                        HARI BIASA
                                    </th>

                                    <th colspan="2">
                                        OFF &lt; 4 JAM
                                    </th>

                                    <th colspan="2">
                                        OFF &lt; 8 JAM
                                    </th>

                                    <th colspan="2">
                                        OFF &gt; 8 JAM
                                    </th>

                                    <th colspan="2">
                                        CUTI AM &lt; 8 JAM
                                    </th>

                                    <th colspan="2">
                                        CUTI AM &gt; 8 JAM
                                    </th>

                                    <th rowspan="2">
                                        JUMLAH RM
                                    </th>

                                </tr>


                                <tr>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                    <th>
                                        JAM
                                    </th>

                                    <th>
                                        RM
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                ${senarai
                                    .map(
                                        (a, i) =>
                                            binaRow(
                                                a,
                                                i
                                            )
                                    )
                                    .join("")}

                            </tbody>

                        </table>

                    </div>
                `;


                container.appendChild(
                    card
                );

            }
        );

}


// =====================================================
// BINA ROW
// =====================================================

function binaRow(
    a,
    index
) {

    const row =
        dataKLM.find(
            r =>
                String(r.noskb) ===
                String(a.noskb)
        );


    const get =
        field =>
            Number(
                row?.[field] || 0
            );


    return `

        <tr
            data-noskb="${escapeHtml(a.noskb)}"
        >

            <td>
                ${index + 1}
            </td>

            <td>
                ${escapeHtml(a.noskb)}
            </td>

            <td>
                ${escapeHtml(a.noanggota)}
            </td>

            <td class="nama-col">
                ${escapeHtml(a.nama)}
            </td>


            <!-- HARI BIASA -->

            <td class="klm-input">
                ${get("hari_biasa_jam").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_hari_biasa"
            >
                RM 0.00
            </td>


            <!-- OFF < 4 JAM -->
            <!-- ABAIKAN PENGIRAAN -->

            <td class="klm-input">
                ${get("off_kurang_4").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_off_kurang_4"
            >
                RM 0.00
            </td>


            <!-- OFF < 8 JAM -->

            <td class="klm-input">
                ${get("off_kurang_8").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_off_kurang_8"
            >
                RM 0.00
            </td>


            <!-- OFF > 8 JAM -->

            <td class="klm-input">
                ${get("off_lebih_8").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_off_lebih_8"
            >
                RM 0.00
            </td>


            <!-- CUTI AM < 8 JAM -->

            <td class="klm-input">
                ${get("cuti_kurang_8").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_cuti_kurang_8"
            >
                RM 0.00
            </td>


            <!-- CUTI AM > 8 JAM -->

            <td class="klm-input">
                ${get("cuti_lebih_8").toFixed(2)}
            </td>

            <td
                class="rm-value"
                data-rm="rm_cuti_lebih_8"
            >
                RM 0.00
            </td>


            <!-- JUMLAH -->

            <td
                class="rm-total"
                data-rm="rm_jumlah"
            >
                RM 0.00
            </td>

        </tr>

    `;

}


// =====================================================
// KIRA SEMUA RM
// =====================================================

function kiraSemuaRM() {

    if (!dataKLM.length) {

        paparStatus(
            "⚠️ Tiada data KLM untuk minggu ini.",
            true
        );

        return;

    }


    document
        .querySelectorAll(
            ".klm-table tbody tr"
        )
        .forEach(tr => {


            // =================================================
            // NO SKB
            // =================================================

            const noskb =
                tr.dataset.noskb;


            // =================================================
            // DATA ANGGOTA
            // =================================================

            const anggotaData =
                anggota.find(
                    a =>
                        String(a.noskb) ===
                        String(noskb)
                );


            // =================================================
            // DATA KLM
            // =================================================

            const klm =
                dataKLM.find(
                    r =>
                        String(r.noskb) ===
                        String(noskb)
                );


            if (!anggotaData || !klm) {

                return;

            }


            // =================================================
            // KADAR RM
            // =================================================

            const kadarBiasa =
                Number(
                    anggotaData
                        .rm_pehariklmbiasa || 0
                );


            const kadarOffHari =
                Number(
                    anggotaData
                        .rm_perharioffday || 0
                );


            const kadarOffJam =
                Number(
                    anggotaData
                        .rm_perjamoffday || 0
                );


            const kadarCutiHari =
                Number(
                    anggotaData
                        .rm_perharicutiam || 0
                );


            const kadarCutiJam =
                Number(
                    anggotaData
                        .rm_perjamcutiam || 0
                );


            // =================================================
            // DATA KLM
            // =================================================

            const hariBiasa =
                Number(
                    klm.hari_biasa_jam || 0
                );


            const offKurang4 =
                Number(
                    klm.off_kurang_4 || 0
                );


            const offKurang8 =
                Number(
                    klm.off_kurang_8 || 0
                );


            const offLebih8 =
                Number(
                    klm.off_lebih_8 || 0
                );


            const cutiKurang8 =
                Number(
                    klm.cuti_kurang_8 || 0
                );


            const cutiLebih8 =
                Number(
                    klm.cuti_lebih_8 || 0
                );


            // =================================================
            // FORMULA
            // =================================================


            // -------------------------------------------------
            // HARI BIASA
            // -------------------------------------------------

            const rmHariBiasa =
                hariBiasa *
                kadarBiasa;


            // -------------------------------------------------
            // OFF < 4 JAM
            // -------------------------------------------------
            // ABAIKAN
            // -------------------------------------------------

            const rmOffKurang4 = 0;


            // -------------------------------------------------
            // OFF < 8 JAM
            // -------------------------------------------------

            const rmOffKurang8 =
                offKurang8 *
                kadarOffJam;


            // -------------------------------------------------
            // OFF > 8 JAM
            // -------------------------------------------------

            const rmOffLebih8 =
                offLebih8 *
                kadarOffHari;


            // -------------------------------------------------
            // CUTI AM < 8 JAM
            // -------------------------------------------------

            const rmCutiKurang8 =
                cutiKurang8 *
                kadarCutiJam;


            // -------------------------------------------------
            // CUTI AM > 8 JAM
            // -------------------------------------------------

            const rmCutiLebih8 =
                cutiLebih8 *
                kadarCutiHari;


            // =================================================
            // JUMLAH RM
            // =================================================

            const jumlah =
                rmHariBiasa +
                rmOffKurang4 +
                rmOffKurang8 +
                rmOffLebih8 +
                rmCutiKurang8 +
                rmCutiLebih8;


            // =================================================
            // PAPAR
            // =================================================

            setRM(
                tr,
                "rm_hari_biasa",
                rmHariBiasa
            );


            // OFF < 4 JAM = RM 0

            setRM(
                tr,
                "rm_off_kurang_4",
                0
            );


            setRM(
                tr,
                "rm_off_kurang_8",
                rmOffKurang8
            );


            setRM(
                tr,
                "rm_off_lebih_8",
                rmOffLebih8
            );


            setRM(
                tr,
                "rm_cuti_kurang_8",
                rmCutiKurang8
            );


            setRM(
                tr,
                "rm_cuti_lebih_8",
                rmCutiLebih8
            );


            setRM(
                tr,
                "rm_jumlah",
                jumlah
            );


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "================================="
            );

            console.log(
                "PENGIRAAN RM"
            );

            console.log(
                "NO SKB:",
                noskb
            );

            console.log(
                "NAMA:",
                anggotaData.nama
            );

            console.log(
                "---------------------------------"
            );

            console.log(
                "KADAR HARI BIASA:",
                kadarBiasa
            );

            console.log(
                "KADAR OFF HARI:",
                kadarOffHari
            );

            console.log(
                "KADAR OFF JAM:",
                kadarOffJam
            );

            console.log(
                "KADAR CUTI HARI:",
                kadarCutiHari
            );

            console.log(
                "KADAR CUTI JAM:",
                kadarCutiJam
            );

            console.log(
                "---------------------------------"
            );

            console.log(
                "HARI BIASA:",
                hariBiasa,
                "×",
                kadarBiasa,
                "=",
                rmHariBiasa
            );

            console.log(
                "OFF < 4 JAM:",
                offKurang4,
                "× ABAIKAN = RM 0.00"
            );

            console.log(
                "OFF < 8 JAM:",
                offKurang8,
                "×",
                kadarOffJam,
                "=",
                rmOffKurang8
            );

            console.log(
                "OFF > 8 JAM:",
                offLebih8,
                "×",
                kadarOffHari,
                "=",
                rmOffLebih8
            );

            console.log(
                "CUTI AM < 8 JAM:",
                cutiKurang8,
                "×",
                kadarCutiJam,
                "=",
                rmCutiKurang8
            );

            console.log(
                "CUTI AM > 8 JAM:",
                cutiLebih8,
                "×",
                kadarCutiHari,
                "=",
                rmCutiLebih8
            );

            console.log(
                "---------------------------------"
            );

            console.log(
                "JUMLAH RM:",
                jumlah
            );

            console.log(
                "================================="
            );

        });


    paparStatus(
        "✅ Pengiraan RM berjaya dilakukan."
    );

}


// =====================================================
// SET RM
// =====================================================

function setRM(
    row,
    field,
    value
) {

    const element =
        row.querySelector(
            `[data-rm="${field}"]`
        );


    if (!element) return;


    const nilai =
        Number(value) || 0;


    element.dataset.value =
        nilai.toFixed(2);


    element.textContent =
        "RM " +
        nilai.toFixed(2);

}


// =====================================================
// SIMPAN RM
// =====================================================

async function simpanRM() {

    if (!dataKLM.length) {

        paparStatus(
            "⚠️ Tiada data KLM untuk disimpan.",
            true
        );

        return;

    }


    const btn =
        document.getElementById(
            "btnSimpan"
        );


    if (btn) {

        btn.disabled = true;

        btn.textContent =
            "⏳ MENYIMPAN...";

    }


    try {

        // =================================================
        // KIRA DAHULU
        // =================================================

        kiraSemuaRM();


        const rows = [];


        document
            .querySelectorAll(
                ".klm-table tbody tr"
            )
            .forEach(tr => {


                const noskb =
                    tr.dataset.noskb;


                const original =
                    dataKLM.find(
                        r =>
                            String(r.noskb) ===
                            String(noskb)
                    );


                if (!original) {

                    return;

                }


                rows.push({

                    id:
                        original.id,

                    bulan:
                        original.bulan,

                    tahun:
                        original.tahun,

                    minggu:
                        original.minggu,

                    unit:
                        original.unit,

                    poskhidmat:
                        original.poskhidmat,

                    noskb:
                        original.noskb,

                    noanggota:
                        original.noanggota,

                    nama:
                        original.nama,


                    // =================================================
                    // DATA KLM
                    // =================================================

                    hari_biasa_jam:
                        Number(
                            original.hari_biasa_jam || 0
                        ),


                    off_kurang_4:
                        Number(
                            original.off_kurang_4 || 0
                        ),


                    off_kurang_8:
                        Number(
                            original.off_kurang_8 || 0
                        ),


                    off_lebih_8:
                        Number(
                            original.off_lebih_8 || 0
                        ),


                    cuti_kurang_8:
                        Number(
                            original.cuti_kurang_8 || 0
                        ),


                    cuti_lebih_8:
                        Number(
                            original.cuti_lebih_8 || 0
                        ),


                    // =================================================
                    // RM
                    // =================================================

                    rm_hari_biasa:
                        getRM(
                            tr,
                            "rm_hari_biasa"
                        ),


                    // OFF < 4 = 0

                    rm_off_kurang_4:
                        0,


                    rm_off_kurang_8:
                        getRM(
                            tr,
                            "rm_off_kurang_8"
                        ),


                    rm_off_lebih_8:
                        getRM(
                            tr,
                            "rm_off_lebih_8"
                        ),


                    rm_cuti_kurang_8:
                        getRM(
                            tr,
                            "rm_cuti_kurang_8"
                        ),


                    rm_cuti_lebih_8:
                        getRM(
                            tr,
                            "rm_cuti_lebih_8"
                        ),


                    rm_jumlah:
                        getRM(
                            tr,
                            "rm_jumlah"
                        ),


                    updated_at:
                        new Date()
                            .toISOString()

                });

            });


        if (!rows.length) {

            throw new Error(
                "Tiada rekod untuk disimpan."
            );

        }


        console.log(
            "ROWS SIMPAN RM:",
            rows
        );


        // =================================================
        // UPSERT KE KLM_Mingguan
        // =================================================

        const {
            error
        } =
        await db
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
            `✅ RM ${mingguSemasa} berjaya disimpan.`
        );


        if (btn) {

            btn.textContent =
                "✅ BERJAYA DISIMPAN";


            setTimeout(
                () => {

                    btn.textContent =
                        "💾 SIMPAN RM";

                },
                2000
            );

        }


    } catch (error) {

        console.error(
            "RALAT SIMPAN RM:",
            error
        );


        paparStatus(
            "❌ Gagal menyimpan RM: " +
            error.message,
            true
        );


        if (btn) {

            btn.textContent =
                "❌ GAGAL SIMPAN";

        }


    } finally {

        if (btn) {

            btn.disabled = false;

        }

    }

}


// =====================================================
// GET RM
// =====================================================

function getRM(
    row,
    field
) {

    const element =
        row.querySelector(
            `[data-rm="${field}"]`
        );


    if (!element) {

        return 0;

    }


    return Number(
        element.dataset.value || 0
    );

}


// =====================================================
// EXPORT CSV
// =====================================================

function exportCSV() {

    if (!dataKLM.length) {

        paparStatus(
            "⚠️ Tiada data untuk dieksport.",
            true
        );

        return;

    }


    // =================================================
    // KIRA TERLEBIH DAHULU
    // =================================================

    kiraSemuaRM();


    const rows = [];


    // =================================================
    // HEADER CSV
    // =================================================

    rows.push([

        "BIL",

        "NO SKB",

        "NO ANGGOTA",

        "NAMA",

        "POS",


        "HARI BIASA JAM",

        "HARI BIASA RM",


        "OFF < 4 JAM",

        "OFF < 4 RM",


        "OFF < 8 JAM",

        "OFF < 8 RM",


        "OFF > 8 JAM",

        "OFF > 8 RM",


        "CUTI AM < 8 JAM",

        "CUTI AM < 8 RM",


        "CUTI AM > 8 JAM",

        "CUTI AM > 8 RM",


        "JUMLAH RM"

    ]);


    let bil = 1;


    // =================================================
    // DATA
    // =================================================

    anggota.forEach(a => {


        const klm =
            dataKLM.find(
                r =>
                    String(r.noskb) ===
                    String(a.noskb)
            );


        if (!klm) {

            return;

        }


        const tr =
            document.querySelector(
                `tr[data-noskb="${CSS.escape(String(a.noskb))}"]`
            );


        if (!tr) {

            return;

        }


        rows.push([

            bil++,

            a.noskb,

            a.noanggota,

            a.nama,

            a.poskhidmat,


            // HARI BIASA

            klm.hari_biasa_jam || 0,

            getRM(
                tr,
                "rm_hari_biasa"
            ),


            // OFF < 4

            klm.off_kurang_4 || 0,

            0,


            // OFF < 8

            klm.off_kurang_8 || 0,

            getRM(
                tr,
                "rm_off_kurang_8"
            ),


            // OFF > 8

            klm.off_lebih_8 || 0,

            getRM(
                tr,
                "rm_off_lebih_8"
            ),


            // CUTI < 8

            klm.cuti_kurang_8 || 0,

            getRM(
                tr,
                "rm_cuti_kurang_8"
            ),


            // CUTI > 8

            klm.cuti_lebih_8 || 0,

            getRM(
                tr,
                "rm_cuti_lebih_8"
            ),


            // JUMLAH

            getRM(
                tr,
                "rm_jumlah"
            )

        ]);

    });


    // =================================================
    // BINA CSV
    // =================================================

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(csvEscape)
                        .join(",")
            )
            .join("\r\n");


    const blob =
        new Blob(
            [
                "\ufeff" + csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    const bulan =
        document.getElementById(
            "bulan"
        ).value;


    const tahun =
        document.getElementById(
            "tahun"
        ).value;


    link.href =
        url;


    link.download =
        `KLM_RM_${bulan}_${tahun}_${mingguSemasa.replaceAll(" ", "_")}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );


    paparStatus(
        "✅ CSV berjaya disediakan."
    );

}


// =====================================================
// CSV ESCAPE
// =====================================================

function csvEscape(value) {

    const text =
        String(value ?? "");


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n") ||
        text.includes("\r")
    ) {

        return '"' +
            text.replaceAll(
                '"',
                '""'
            ) +
            '"';

    }


    return text;

}


// =====================================================
// STATUS
// =====================================================

function paparStatus(
    message,
    error = false
) {

    const box =
        document.getElementById(
            "statusBox"
        );


    if (!box) return;


    box.textContent =
        message;


    box.classList.remove(
        "hidden",
        "error"
    );


    if (error) {

        box.classList.add(
            "error"
        );

    }


    setTimeout(
        () => {

            box.classList.add(
                "hidden"
            );

        },
        5000
    );

}


// =====================================================
// LOADING
// =====================================================

function paparLoading(
    show
) {

    const box =
        document.getElementById(
            "loadingBox"
        );


    if (!box) return;


    box.classList.toggle(
        "hidden",
        !show
    );

}


// =====================================================
// TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value || "-";

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


console.log(
    "================================="
);

console.log(
    "KLM RM JS FULLY LOADED"
);

console.log(
    "FORMULA:"
);

console.log(
    "HARI BIASA = JAM × KADAR BIASA"
);

console.log(
    "OFF < 4 JAM = ABAIKAN"
);

console.log(
    "OFF < 8 JAM = JAM × KADAR OFF"
);

console.log(
    "OFF > 8 JAM = HARI × KADAR OFF"
);

console.log(
    "CUTI AM < 8 JAM = JAM × KADAR CUTI"
);

console.log(
    "CUTI AM > 8 JAM = HARI × KADAR CUTI"
);

console.log(
    "================================="
);
