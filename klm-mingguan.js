// =====================================================
// KLM MINGGUAN
// =====================================================

console.log("KLM MINGGUAN JS READY");


// =====================================================
// GLOBAL
// =====================================================

let db = null;

let pengguna = null;

let anggotaSemua = [];

let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";


// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("KLM MINGGUAN: INIT");

    // -------------------------------------------------
    // SUPABASE
    // -------------------------------------------------

    db = window.supabaseClient;

    if (!db) {

        console.error(
            "Supabase client tidak dijumpai."
        );

        paparStatus(
            "Supabase tidak berjaya disambungkan.",
            true
        );

        return;
    }


    // -------------------------------------------------
    // SETUP
    // -------------------------------------------------

    binaTahun();

    tetapkanBulanSemasa();

    pasangEvent();


    // -------------------------------------------------
    // LOGIN USER
    // -------------------------------------------------

    const berjaya =
        await dapatkanPengguna();

    if (!berjaya) {
        return;
    }


    // -------------------------------------------------
    // MUAT ANGGOTA
    // -------------------------------------------------

    await muatAnggota();


    // -------------------------------------------------
    // MUAT KLM
    // -------------------------------------------------

    await muatDataMinggu();

});


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

    const select =
        document.getElementById("bulan");

    if (!select) return;

    const bulan =
        new Date().getMonth() + 1;

    select.value = bulan;

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {

    // -------------------------------------------------
    // TAB MINGGU
    // -------------------------------------------------

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(".week-tab")
                        .forEach(t => {

                            t.classList.remove(
                                "active"
                            );

                        });


                    tab.classList.add("active");


                    mingguSemasa =
                        tab.dataset.minggu;


                    const text =
                        document.getElementById(
                            "mingguSemasaText"
                        );


                    if (text) {

                        text.textContent =
                            mingguSemasa;

                    }


                    await muatDataMinggu();

                }
            );

        });


    // -------------------------------------------------
    // BULAN
    // -------------------------------------------------

    const bulan =
        document.getElementById("bulan");

    if (bulan) {

        bulan.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // -------------------------------------------------
    // TAHUN
    // -------------------------------------------------

    const tahun =
        document.getElementById("tahun");

    if (tahun) {

        tahun.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // -------------------------------------------------
    // SIMPAN
    // -------------------------------------------------

    const btnSimpan =
        document.getElementById("btnSimpan");

    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanMinggu
        );

    }


    // -------------------------------------------------
    // LOGOUT
    // -------------------------------------------------

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
            },
            error
        } = await db.auth.getUser();


        if (error) {

            throw error;

        }


        if (!user) {

            console.warn(
                "Tiada pengguna login."
            );

            window.location.href =
                "login.html";

            return false;

        }


        pengguna = user;


        // =============================================
        // AMBIL NAMA USER
        // =============================================

        const nama =
            user.user_metadata?.nama ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";


        const email =
            user.email || "";


        const namaPaparan =
            nama || email;


        // =============================================
        // PAPAR NAMA USER
        // =============================================

        const namaPengguna =
            document.getElementById(
                "namaPengguna"
            );


        if (namaPengguna) {

            namaPengguna.textContent =
                namaPaparan;

        }


        const namaSidebar =
            document.getElementById(
                "namaPenggunaSidebar"
            );


        if (namaSidebar) {

            namaSidebar.textContent =
                namaPaparan;

        }


        console.log(
            "PENGGUNA LOGIN:",
            {
                email,
                nama,
                user_id: user.id
            }
        );


        return true;


    } catch (error) {

        console.error(
            "RALAT PENGGUNA:",
            error
        );


        paparStatus(
            "Gagal mendapatkan pengguna: " +
            error.message,
            true
        );


        return false;

    }

}


// =====================================================
// MUAT ANGGOTA
// =====================================================

async function muatAnggota() {

    paparLoading(true);


    try {

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


        anggotaSemua =
            data || [];


        console.log(
            "DATA ANGGOTA:",
            anggotaSemua.length
        );


        // -------------------------------------------------
        // TENTUKAN KETUA UNIT
        // -------------------------------------------------

        const berjaya =
            tentukanKetuaUnit();


        if (!berjaya) {

            return;

        }


        // -------------------------------------------------
        // PAPAR ANGGOTA
        // -------------------------------------------------

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

    if (
        !pengguna ||
        !anggotaSemua.length
    ) {

        return false;

    }


    // -------------------------------------------------
    // NAMA LOGIN
    // -------------------------------------------------

    const namaLogin =
        (
            pengguna.user_metadata?.nama ||
            pengguna.user_metadata?.full_name ||
            pengguna.user_metadata?.name ||
            ""
        )
        .trim()
        .toLowerCase();


    const email =
        (
            pengguna.email ||
            ""
        )
        .trim()
        .toLowerCase();


    // -------------------------------------------------
    // CUBA CARI KETUA UNIT
    // -------------------------------------------------

    let rekodKetua = null;


    if (namaLogin) {

        rekodKetua =
            anggotaSemua.find(a => {

                const ketua =
                    (
                        a.ketua_unit ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    ketua ===
                    namaLogin
                );

            });

    }


    // -------------------------------------------------
    // CUBA GUNA EMAIL
    // -------------------------------------------------

    if (
        !rekodKetua &&
        email
    ) {

        const emailNama =
            email
                .split("@")[0]
                .replace(/[._-]/g, " ")
                .trim()
                .toLowerCase();


        rekodKetua =
            anggotaSemua.find(a => {

                const ketua =
                    (
                        a.ketua_unit ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    ketua ===
                    emailNama
                );

            });

    }


    // -------------------------------------------------
    // JIKA TIDAK JUMPA
    // -------------------------------------------------

    if (!rekodKetua) {

        console.warn(
            "Rekod Ketua Unit tidak ditemui."
        );


        paparStatus(
            "Ketua Unit login tidak ditemui dalam Data_Anggota.ketua_unit.",
            true
        );


        return false;

    }


    // -------------------------------------------------
    // DATA KETUA UNIT
    // -------------------------------------------------

    const namaKetua =
        rekodKetua.ketua_unit || "";


    const unit =
        rekodKetua.unit || "";


    // -------------------------------------------------
    // PAPAR UNIT
    // -------------------------------------------------

    const paparKetua =
        document.getElementById(
            "paparKetuaUnit"
        );


    if (paparKetua) {

        paparKetua.textContent =
            namaKetua || "-";

    }


    const paparUnit =
        document.getElementById(
            "paparUnit"
        );


    if (paparUnit) {

        paparUnit.textContent =
            unit || "-";

    }


    const unitPengguna =
        document.getElementById(
            "unitPengguna"
        );


    if (unitPengguna) {

        unitPengguna.textContent =
            unit || "-";

    }


    const unitSidebar =
        document.getElementById(
            "unitPenggunaSidebar"
        );


    if (unitSidebar) {

        unitSidebar.textContent =
            unit || "-";

    }


    // -------------------------------------------------
    // FILTER ANGGOTA IKUT KETUA UNIT
    // -------------------------------------------------

    anggota =
        anggotaSemua.filter(a => {

            const ketua =
                (
                    a.ketua_unit ||
                    ""
                )
                .trim()
                .toLowerCase();


            return (
                ketua ===
                namaKetua
                    .trim()
                    .toLowerCase()
            );

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


    return true;

}


// =====================================================
// PAPAR ANGGOTA
// =====================================================

function paparAnggota() {

    const container =
        document.getElementById(
            "senaraiPos"
        );


    if (!container) {

        console.error(
            "Element #senaraiPos tidak dijumpai."
        );

        return;

    }


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `
            <div class="card">
                <strong>Tiada anggota.</strong>
                <p>
                    Tiada anggota dijumpai
                    di bawah Ketua Unit ini.
                </p>
            </div>
        `;

        return;

    }


    // -------------------------------------------------
    // GROUP IKUT POS
    // -------------------------------------------------

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


    // -------------------------------------------------
    // BINA TABLE SETIAP POS
    // -------------------------------------------------

    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-card";


                // -------------------------------
                // HEADER POS
                // -------------------------------

                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "pos-header";


                header.innerHTML = `
                    <div>
                        <span class="pos-title">
                            ${escapeHtml(pos)}
                        </span>

                        <span class="pos-count">
                            ${senarai.length} ANGGOTA
                        </span>
                    </div>
                `;


                // -------------------------------
                // TABLE
                // -------------------------------

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "table-wrapper";


                const table =
                    document.createElement(
                        "table"
                    );


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

                            <th rowspan="2"
                                class="hari-biasa">
                                HARI BIASA
                                <br>
                                <small>JAM</small>
                            </th>

                            <th colspan="3"
                                class="hari-off">
                                HARI OFF
                            </th>

                            <th colspan="2"
                                class="hari-cuti">
                                HARI CUTI AM
                            </th>

                        </tr>

                        <tr>

                            <th class="hari-off">
                                KURANG
                                <br>
                                4 JAM
                            </th>

                            <th class="hari-off">
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th class="hari-off">
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                            <th class="hari-cuti">
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th class="hari-cuti">
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                        </tr>

                    </thead>

                    <tbody></tbody>

                `;


                const tbody =
                    table.querySelector(
                        "tbody"
                    );


                // -------------------------------
                // ROW ANGGOTA
                // -------------------------------

                senarai.forEach(
                    (a, index) => {

                        const tr =
                            document.createElement(
                                "tr"
                            );


                        tr.dataset.noskb =
                            a.noskb;


                        tr.innerHTML = `

                            <td class="col-bil">
                                ${index + 1}
                            </td>

                            <td class="col-skb">
                                ${a.noskb ?? ""}
                            </td>

                            <td class="col-anggota">
                                ${escapeHtml(
                                    a.noanggota || ""
                                )}
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

            }
        );

}


// =====================================================
// INPUT KLM
// =====================================================

function inputKLM(
    field,
    noskb
) {

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


        dataKLM =
            data || [];


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


        // Table belum ada / belum boleh baca
        paparAnggota();


        paparStatus(
            "Gagal memuatkan KLM_Mingguan: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// ISI DATA DATABASE KE INPUT
// =====================================================

function isiDataKeInput() {

    if (!dataKLM.length) {

        return;

    }


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
// SIMPAN MINGGU
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
        (
            document.getElementById(
                "paparUnit"
            )?.textContent ||
            ""
        )
        .trim();


    const ketuaUnit =
        (
            document.getElementById(
                "paparKetuaUnit"
            )?.textContent ||
            ""
        )
        .trim();


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
                    Number(
                        input.value || 0
                    );

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


        console.log(
            "DATA AKAN DISIMPAN:",
            rows
        );


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


        if (btn) {

            btn.textContent =
                "✅ BERJAYA DISIMPAN";


            setTimeout(() => {

                btn.textContent =
                    "💾 SIMPAN MINGGU";

            }, 2000);

        }


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


    if (!box) {

        console.log(
            message
        );

        return;

    }


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


    setTimeout(() => {

        box.classList.add(
            "hidden"
        );

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


    if (!box) return;


    if (show) {

        box.classList.remove(
            "hidden"
        );

    } else {

        box.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)

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
