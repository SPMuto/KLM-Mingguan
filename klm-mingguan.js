// =====================================================
// KLM MINGGUAN
// KETUA UNIT
// =====================================================

console.log("=================================");
console.log("KLM MINGGUAN JS READY");
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

document.addEventListener("DOMContentLoaded", async () => {

    console.log("KLM MINGGUAN: INIT");

    db = window.supabaseClient;

    if (!db) {

        console.error(
            "Supabase client tidak dijumpai."
        );

        paparStatus(
            "❌ Supabase tidak berjaya disambungkan.",
            true
        );

        return;
    }


    binaTahun();

    tetapkanBulanSemasa();

    pasangEvent();


    // =============================================
    // 1. DAPATKAN USER LOGIN
    // =============================================

    const berjayaLogin =
        await dapatkanPengguna();

    if (!berjayaLogin) {
        return;
    }


    // =============================================
    // 2. DAPATKAN PROFIL KETUA UNIT
    // =============================================

    const berjayaProfil =
        await dapatkanProfilKetuaUnit();

    if (!berjayaProfil) {
        return;
    }


    // =============================================
    // 3. DAPATKAN ANGGOTA UNIT
    // =============================================

    const berjayaAnggota =
        await muatAnggota();

    if (!berjayaAnggota) {
        return;
    }


    // =============================================
    // 4. LOAD DATA MINGGU
    // =============================================

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

    // =============================================
    // WEEK TAB
    // =============================================

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


    // =============================================
    // BULAN
    // =============================================

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


    // =============================================
    // TAHUN
    // =============================================

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


    // =============================================
    // SIMPAN
    // =============================================

    const btnSimpan =
        document.getElementById("btnSimpan");

    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanMinggu
        );

    }


    // =============================================
    // LOGOUT
    // =============================================

    const btnLogout =
        document.getElementById("btnLogout");

    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            async () => {

                try {

                    await db.auth.signOut();

                } catch (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

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
        } =
        await db.auth.getUser();


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
        // PAPAR NAMA
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
                id: user.id,
                email: email,
                nama: nama
            }
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
// PROFIL KETUA UNIT
// =====================================================

async function dapatkanProfilKetuaUnit() {

    try {

        console.log(
            "MENCARI PROFIL KETUA UNIT:",
            pengguna.id
        );


        const {
            data,
            error
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
            .eq(
                "user_id",
                pengguna.id
            )
            .eq(
                "status",
                "Aktif"
            )
            .eq(
                "role",
                "ketua_unit"
            )
            .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            console.error(
                "PROFIL KETUA UNIT TIADA."
            );


            paparStatus(
                "❌ Akaun ini belum didaftarkan sebagai Ketua Unit.",
                true
            );


            return false;
        }


        profilKetuaUnit =
            data;


        console.log(
            "PROFIL KETUA UNIT:",
            profilKetuaUnit
        );


        // =============================================
        // PAPAR KETUA UNIT
        // =============================================

        const paparKetuaUnit =
            document.getElementById(
                "paparKetuaUnit"
            );


        if (paparKetuaUnit) {

            paparKetuaUnit.textContent =
                data.nama || "-";

        }


        // =============================================
        // PAPAR UNIT
        // =============================================

        const paparUnit =
            document.getElementById(
                "paparUnit"
            );


        if (paparUnit) {

            paparUnit.textContent =
                data.unit || "-";

        }


        const unitPengguna =
            document.getElementById(
                "unitPengguna"
            );


        if (unitPengguna) {

            unitPengguna.textContent =
                data.unit || "-";

        }


        const unitSidebar =
            document.getElementById(
                "unitPenggunaSidebar"
            );


        if (unitSidebar) {

            unitSidebar.textContent =
                data.unit || "-";

        }


        return true;


    } catch (error) {

        console.error(
            "RALAT PROFIL KETUA UNIT:",
            error
        );


        paparStatus(
            "❌ Gagal mendapatkan profil Ketua Unit: " +
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

        if (!profilKetuaUnit) {

            throw new Error(
                "Profil Ketua Unit belum tersedia."
            );

        }


        const unit =
            profilKetuaUnit.unit;


        console.log(
            "MUAT ANGGOTA UNIT:",
            unit
        );


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
                ketua_unit,
                status
            `)
            .eq(
                "unit",
                unit
            )
            .eq(
                "status",
                "Aktif"
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


        anggota =
            data || [];


        console.log(
            "ANGGOTA UNIT:",
            anggota.length
        );


        paparAnggota();


        return true;


    } catch (error) {

        console.error(
            "RALAT MUAT ANGGOTA:",
            error
        );


        paparStatus(
            "❌ Gagal memuatkan anggota: " +
            error.message,
            true
        );


        return false;


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// PAPAR ANGGOTA
// =====================================================

function paparAnggota() {

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

                <p>
                    Tiada anggota aktif dijumpai
                    untuk unit
                    <strong>
                        ${escapeHtml(
                            profilKetuaUnit?.unit || "-"
                        )}
                    </strong>.
                </p>
            </div>
        `;

        return;

    }


    // =============================================
    // GROUP IKUT POS
    // =============================================

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


    // =============================================
    // BINA TABLE SETIAP POS
    // =============================================

    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-card";


                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "pos-header";


                header.innerHTML = `
                    <span>
                        📍
                        ${escapeHtml(pos)}
                    </span>

                    <small>
                        ${senarai.length}
                        anggota
                    </small>
                `;


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

                            <th rowspan="2">
                                BIL
                            </th>

                            <th rowspan="2">
                                NO SKB
                            </th>

                            <th rowspan="2">
                                NO ANGGOTA
                            </th>

                            <th rowspan="2"
                                class="nama-col">

                                NAMA ANGGOTA

                            </th>

                            <th rowspan="2">
                                HARI BIASA
                                <br>
                                <small>
                                    JAM
                                </small>
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
                    table.querySelector(
                        "tbody"
                    );


                senarai.forEach(
                    (a, index) => {

                        const tr =
                            document.createElement(
                                "tr"
                            );


                        tr.dataset.noskb =
                            a.noskb;


                        tr.innerHTML = `

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${a.noskb ?? ""}
                            </td>

                            <td>
                                ${escapeHtml(
                                    a.noanggota || ""
                                )}
                            </td>

                            <td class="nama-col">
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
        } =
        await db
            .from("KLM_Mingguan")
            .select("*")
            .eq(
                "bulan",
                bulan
            )
            .eq(
                "tahun",
                tahun
            )
            .eq(
                "minggu",
                mingguSemasa
            )
            .eq(
                "unit",
                profilKetuaUnit.unit
            );


        if (error) {
            throw error;
        }


        dataKLM =
            data || [];


        console.log(
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


        paparAnggota();


        paparStatus(
            "⚠️ Data minggu belum dapat dimuatkan: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// ISI DATA KE INPUT
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
// SIMPAN MINGGU
// =====================================================

async function simpanMinggu() {

    if (!profilKetuaUnit) {

        alert(
            "Profil Ketua Unit tidak dijumpai."
        );

        return;

    }


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
        profilKetuaUnit.unit;


    const ketuaUnit =
        profilKetuaUnit.nama;


    const btn =
        document.getElementById(
            "btnSimpan"
        );


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
            `✅ ${mingguSemasa} berjaya disimpan.`
        );


        btn.textContent =
            "✅ BERJAYA DISIMPAN";


        setTimeout(
            () => {

                btn.textContent =
                    "💾 SIMPAN MINGGU";

            },
            2000
        );


    } catch (error) {

        console.error(
            "RALAT SIMPAN:",
            error
        );


        paparStatus(
            "❌ Gagal menyimpan: " +
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
