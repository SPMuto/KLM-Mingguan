console.log("=================================");
console.log("RUMUSAN KLM MINGGUAN JS READY");
console.log("=================================");


// =====================================================
// GLOBAL
// =====================================================

let db = null;

let pengguna = null;

let profilKetuaUnit = null;

let dataRumusan = [];

let mingguSemasa = "MINGGU 1";


// =====================================================
// INIT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("RUMUSAN KLM: INIT");


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


        await binaSenaraiUnit();

        await muatRumusan();

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


        option.value =
            tahun;


        option.textContent =
            tahun;


        if (
            tahun ===
            tahunSekarang
        ) {

            option.selected =
                true;

        }


        select.appendChild(
            option
        );

    }

}


// =====================================================
// BULAN SEMASA
// =====================================================

function tetapkanBulanSemasa() {

    const bulan =
        new Date().getMonth() + 1;


    const select =
        document.getElementById("bulan");


    if (select) {

        select.value =
            bulan;

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

                            t.classList.remove(
                                "active"
                            );

                        });


                    tab.classList.add(
                        "active"
                    );


                    mingguSemasa =
                        mingguBaru;


                    setText(
                        "mingguSemasaText",
                        mingguSemasa
                    );


                    await muatRumusan();

                }
            );

        });


    // =================================================
    // BULAN
    // =================================================

    const bulan =
        document.getElementById(
            "bulan"
        );


    if (bulan) {

        bulan.addEventListener(
            "change",
            muatRumusan
        );

    }


    // =================================================
    // TAHUN
    // =================================================

    const tahun =
        document.getElementById(
            "tahun"
        );


    if (tahun) {

        tahun.addEventListener(
            "change",
            muatRumusan
        );

    }


    // =================================================
    // UNIT
    // =================================================

    const unit =
        document.getElementById(
            "unit"
        );


    if (unit) {

        unit.addEventListener(
            "change",
            muatRumusan
        );

    }


    // =================================================
    // REFRESH
    // =================================================

    const btnRefresh =
        document.getElementById(
            "btnRefresh"
        );


    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            muatRumusan
        );

    }


    // =================================================
    // CSV
    // =================================================

    const btnCSV =
        document.getElementById(
            "btnCSV"
        );


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
        document.getElementById(
            "btnLogout"
        );


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
// SENARAI UNIT
// =====================================================

async function binaSenaraiUnit() {

    const select =
        document.getElementById(
            "unit"
        );


    if (!select) return;


    try {

        const {
            data,
            error
        } =
        await db
            .from("Data_Anggota")
            .select("unit")
            .eq("status", "Aktif");


        if (error) {

            throw error;

        }


        const unitSet =
            new Set();


        (data || [])
            .forEach(row => {

                const unit =
                    String(
                        row.unit || ""
                    ).trim();


                if (unit) {

                    unitSet.add(
                        unit
                    );

                }

            });


        select.innerHTML = `
            <option value="">
                SEMUA UNIT
            </option>
        `;


        [...unitSet]
            .sort()
            .forEach(unit => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    unit;


                option.textContent =
                    unit;


                /*
                 * Ketua Unit hanya melihat
                 * unit sendiri sebagai default.
                 */

                if (
                    unit ===
                    profilKetuaUnit.unit
                ) {

                    option.selected =
                        true;

                }


                select.appendChild(
                    option
                );

            });


        /*
         * Ketua Unit secara default
         * dipaparkan unit sendiri.
         */

        select.value =
            profilKetuaUnit.unit;


    } catch (error) {

        console.error(
            "RALAT SENARAI UNIT:",
            error
        );

        paparStatus(
            "❌ Gagal memuat senarai unit: " +
            error.message,
            true
        );

    }

}


// =====================================================
// MUAT RUMUSAN
// =====================================================

async function muatRumusan() {

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
            document.getElementById(
                "unit"
            ).value;


        console.log(
            "================================="
        );

        console.log(
            "MUAT RUMUSAN KLM"
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
            unit || "SEMUA UNIT"
        );

        console.log(
            "================================="
        );


        let query =
            db
                .from("KLM_Mingguan")
                .select("*")
                .eq("bulan", bulan)
                .eq("tahun", tahun)
                .eq("minggu", mingguSemasa);


        /*
         * Jika unit dipilih,
         * filter unit tersebut.
         */

        if (unit) {

            query =
                query.eq(
                    "unit",
                    unit
                );

        }


        const {
            data,
            error
        } =
        await query
            .order(
                "unit",
                {
                    ascending: true
                }
            )
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


        dataRumusan =
            data || [];


        console.log(
            "✅ DATA RUMUSAN:",
            dataRumusan.length
        );


        paparRumusan();


        if (dataRumusan.length) {

            paparStatus(
                `✅ ${dataRumusan.length} rekod KLM dimuatkan.`
            );

        } else {

            paparStatus(
                "⚠️ Tiada rekod KLM untuk pilihan ini.",
                true
            );

        }


    } catch (error) {

        console.error(
            "RALAT MUAT RUMUSAN:",
            error
        );


        dataRumusan = [];


        paparRumusan();


        paparStatus(
            "❌ Gagal memuat rumusan KLM: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// PAPAR RUMUSAN
// =====================================================

function paparRumusan() {

    const container =
        document.getElementById(
            "rumusanContainer"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!dataRumusan.length) {

        container.innerHTML = `

            <div class="empty-box">

                <div class="empty-icon">
                    📊
                </div>

                <strong>
                    Tiada data KLM
                </strong>

                <div style="margin-top:6px;">
                    Tiada rekod untuk bulan,
                    tahun, minggu dan unit yang dipilih.
                </div>

            </div>

        `;

        setText(
            "infoRumusan",
            "Tiada data KLM untuk pilihan semasa."
        );

        return;

    }


    /*
     * Kumpulan mengikut UNIT
     */

    const kumpulanUnit = {};


    dataRumusan.forEach(row => {

        const unit =
            String(
                row.unit ||
                "UNIT TIDAK DITETAPKAN"
            ).trim();


        if (!kumpulanUnit[unit]) {

            kumpulanUnit[unit] = [];

        }


        kumpulanUnit[unit].push(
            row
        );

    });


    Object.entries(kumpulanUnit)
        .forEach(
            ([unit, senarai]) => {

                const card =
                    binaUnitCard(
                        unit,
                        senarai
                    );


                container.appendChild(
                    card
                );

            }
        );


    setText(
        "infoRumusan",
        `${dataRumusan.length} anggota · ${mingguSemasa}`
    );

}


// =====================================================
// BINA UNIT CARD
// =====================================================

function binaUnitCard(
    unit,
    senarai
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "unit-card";


    const jumlah =
        kiraJumlah(
            senarai
        );


    card.innerHTML = `

        <div class="unit-header">

            <div class="unit-header-title">

                🏢 ${escapeHtml(unit)}

            </div>

            <div class="unit-header-info">

                ${senarai.length}
                anggota

            </div>

        </div>


        <div class="table-wrapper">

            <table class="rumusan-table">

                <thead>

                    <!-- BARIS 1 -->

                    <tr>

                        <th rowspan="3">
                            BIL
                        </th>

                        <th rowspan="3">
                            SKB /<br>
                            NO ANGGOTA
                        </th>

                        <th rowspan="3">
                            NAMA ANGGOTA
                        </th>

                        <th rowspan="3">
                            GAJI POKOK<br>
                            (RM)
                        </th>


                        <th
                            colspan="2"
                            class="header-hari-biasa"
                        >
                            HARI BIASA
                        </th>


                        <th
                            colspan="4"
                            class="header-off"
                        >
                            HARI OFF
                        </th>


                        <th
                            colspan="4"
                            class="header-cuti"
                        >
                            HARI CUTI AM
                        </th>


                        <th
                            rowspan="3"
                            class="header-total"
                        >
                            JUMLAH<br>
                            TUNTUTAN KLM
                        </th>

                    </tr>


                    <!-- BARIS 2 -->

                    <tr>

                        <th colspan="2">
                            JAM
                        </th>


                        <th colspan="2">
                            KURANG 4 JAM
                        </th>


                        <th colspan="2">
                            4 HINGGA 8 JAM
                        </th>


                        <th colspan="2">
                            LEBIH 8 JAM
                        </th>


                        <th colspan="2">
                            KURANG 8 JAM
                        </th>


                        <th colspan="2">
                            LEBIH 8 JAM
                        </th>

                    </tr>


                    <!-- BARIS 3 -->

                    <tr>

                        <th>
                            JAM
                        </th>

                        <th>
                            RM
                        </th>


                        <th>
                            HARI
                        </th>

                        <th>
                            RM
                        </th>


                        <th>
                            HARI
                        </th>

                        <th>
                            RM
                        </th>


                        <th>
                            HARI
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
                            HARI
                        </th>

                        <th>
                            RM
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        senarai
                            .map(
                                (row, index) =>
                                    binaRow(
                                        row,
                                        index
                                    )
                            )
                            .join("")
                    }


                    <!-- JUMLAH -->

                    <tr class="jumlah-row">

                        <td></td>

                        <td class="jumlah-label">
                            JUMLAH
                        </td>

                        <td></td>


                        <td class="jumlah-rm">
                            ${formatRM(
                                jumlah.gaji
                            )}
                        </td>


                        <!-- HARI BIASA -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.hariBiasaJam
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmHariBiasa
                            )}
                        </td>


                        <!-- OFF < 4 -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.offKurang4
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmOffKurang4
                            )}
                        </td>


                        <!-- OFF < 8 -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.offKurang8
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmOffKurang8
                            )}
                        </td>


                        <!-- OFF > 8 -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.offLebih8
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmOffLebih8
                            )}
                        </td>


                        <!-- CUTI < 8 -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.cutiKurang8
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmCutiKurang8
                            )}
                        </td>


                        <!-- CUTI > 8 -->

                        <td class="number">
                            ${formatNumber(
                                jumlah.cutiLebih8
                            )}
                        </td>

                        <td class="rm">
                            ${formatRM(
                                jumlah.rmCutiLebih8
                            )}
                        </td>


                        <!-- TOTAL -->

                        <td class="jumlah-rm">
                            ${formatRM(
                                jumlah.rmJumlah
                            )}
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    `;


    return card;

}


// =====================================================
// BINA ROW
// =====================================================

function binaRow(
    row,
    index
) {

    return `

        <tr>

            <td>
                ${index + 1}
            </td>


            <td class="skb-col">

                <strong>
                    ${escapeHtml(
                        row.noskb
                    )}
                </strong>

                <br>

                <small>
                    ${escapeHtml(
                        row.noanggota
                    )}
                </small>

            </td>


            <td class="nama-col">

                ${escapeHtml(
                    row.nama
                )}

            </td>


            <td class="gaji-col">

                ${formatRM(
                    row.gaji_pokok
                )}

            </td>


            <!-- HARI BIASA -->

            <td class="number">

                ${formatNumber(
                    row.hari_biasa_jam
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_hari_biasa
                )}

            </td>


            <!-- OFF < 4 -->

            <td class="number">

                ${formatNumber(
                    row.off_kurang_4
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_off_kurang_4
                )}

            </td>


            <!-- OFF 4-8 -->

            <td class="number">

                ${formatNumber(
                    row.off_kurang_8
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_off_kurang_8
                )}

            </td>


            <!-- OFF > 8 -->

            <td class="number">

                ${formatNumber(
                    row.off_lebih_8
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_off_lebih_8
                )}

            </td>


            <!-- CUTI < 8 -->

            <td class="number">

                ${formatNumber(
                    row.cuti_kurang_8
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_cuti_kurang_8
                )}

            </td>


            <!-- CUTI > 8 -->

            <td class="number">

                ${formatNumber(
                    row.cuti_lebih_8
                )}

            </td>

            <td class="rm">

                ${formatRM(
                    row.rm_cuti_lebih_8
                )}

            </td>


            <!-- JUMLAH -->

            <td class="rm-total">

                ${formatRM(
                    row.rm_jumlah
                )}

            </td>

        </tr>

    `;

}


// =====================================================
// KIRA JUMLAH
// =====================================================

function kiraJumlah(
    senarai
) {

    const jumlah = {

        gaji: 0,

        hariBiasaJam: 0,
        rmHariBiasa: 0,

        offKurang4: 0,
        rmOffKurang4: 0,

        offKurang8: 0,
        rmOffKurang8: 0,

        offLebih8: 0,
        rmOffLebih8: 0,

        cutiKurang8: 0,
        rmCutiKurang8: 0,

        cutiLebih8: 0,
        rmCutiLebih8: 0,

        rmJumlah: 0

    };


    senarai.forEach(
        row => {

            jumlah.gaji +=
                num(row.gaji_pokok);


            jumlah.hariBiasaJam +=
                num(
                    row.hari_biasa_jam
                );


            jumlah.rmHariBiasa +=
                num(
                    row.rm_hari_biasa
                );


            jumlah.offKurang4 +=
                num(
                    row.off_kurang_4
                );


            jumlah.rmOffKurang4 +=
                num(
                    row.rm_off_kurang_4
                );


            jumlah.offKurang8 +=
                num(
                    row.off_kurang_8
                );


            jumlah.rmOffKurang8 +=
                num(
                    row.rm_off_kurang_8
                );


            jumlah.offLebih8 +=
                num(
                    row.off_lebih_8
                );


            jumlah.rmOffLebih8 +=
                num(
                    row.rm_off_lebih_8
                );


            jumlah.cutiKurang8 +=
                num(
                    row.cuti_kurang_8
                );


            jumlah.rmCutiKurang8 +=
                num(
                    row.rm_cuti_kurang_8
                );


            jumlah.cutiLebih8 +=
                num(
                    row.cuti_lebih_8
                );


            jumlah.rmCutiLebih8 +=
                num(
                    row.rm_cuti_lebih_8
                );


            jumlah.rmJumlah +=
                num(
                    row.rm_jumlah
                );

        }
    );


    return jumlah;

}


// =====================================================
// EXPORT CSV
// =====================================================

function exportCSV() {

    if (!dataRumusan.length) {

        paparStatus(
            "⚠️ Tiada data untuk dieksport.",
            true
        );

        return;

    }


    const rows = [];


    rows.push([

        "BIL",

        "UNIT",

        "NO SKB",

        "NO ANGGOTA",

        "NAMA ANGGOTA",

        "GAJI POKOK",


        "HARI BIASA JAM",
        "HARI BIASA RM",


        "OFF < 4 JAM",
        "OFF < 4 RM",


        "OFF 4-8 JAM",
        "OFF 4-8 RM",


        "OFF > 8 JAM",
        "OFF > 8 RM",


        "CUTI AM < 8 JAM",
        "CUTI AM < 8 RM",


        "CUTI AM > 8 JAM",
        "CUTI AM > 8 RM",


        "JUMLAH TUNTUTAN KLM"

    ]);


    let bil = 1;


    dataRumusan.forEach(
        row => {

            rows.push([

                bil++,

                row.unit || "",

                row.noskb || "",

                row.noanggota || "",

                row.nama || "",

                num(row.gaji_pokok),


                num(
                    row.hari_biasa_jam
                ),

                num(
                    row.rm_hari_biasa
                ),


                num(
                    row.off_kurang_4
                ),

                num(
                    row.rm_off_kurang_4
                ),


                num(
                    row.off_kurang_8
                ),

                num(
                    row.rm_off_kurang_8
                ),


                num(
                    row.off_lebih_8
                ),

                num(
                    row.rm_off_lebih_8
                ),


                num(
                    row.cuti_kurang_8
                ),

                num(
                    row.rm_cuti_kurang_8
                ),


                num(
                    row.cuti_lebih_8
                ),

                num(
                    row.rm_cuti_lebih_8
                ),


                num(
                    row.rm_jumlah
                )

            ]);

        }
    );


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
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const bulan =
        document.getElementById(
            "bulan"
        ).value;


    const tahun =
        document.getElementById(
            "tahun"
        ).value;


    const unit =
        document.getElementById(
            "unit"
        ).value ||
        "SEMUA_UNIT";


    link.href =
        url;


    link.download =
        `RUMUSAN_KLM_${bulan}_${tahun}_${mingguSemasa}_${unit}.csv`
            .replaceAll(" ", "_")
            .replaceAll("/", "-");


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

function csvEscape(
    value
) {

    const text =
        String(
            value ?? ""
        );


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
// NUMBER
// =====================================================

function num(value) {

    const n =
        Number(value);


    return Number.isFinite(n)
        ? n
        : 0;

}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(
    value
) {

    return num(value)
        .toLocaleString(
            "ms-MY",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


// =====================================================
// FORMAT RM
// =====================================================

function formatRM(
    value
) {

    return "RM " +
        num(value)
            .toLocaleString(
                "ms-MY",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

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
    "RUMUSAN KLM MINGGUAN FULLY LOADED"
);

console.log(
    "SOURCE: KLM_Mingguan"
);

console.log(
    "MINGGU: M1 / M2 / M3 / M4-5"
);

console.log(
    "FILTER: BULAN + TAHUN + UNIT"
);

console.log(
    "================================="
);
