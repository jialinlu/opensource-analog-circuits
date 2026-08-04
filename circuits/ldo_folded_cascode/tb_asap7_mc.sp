.title ldo_folded_cascode_asap7_tb
* Testbench for ldo_folded_cascode (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_folded_cascode migrated from sky130 (2V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Passives: sky130 MIM caps / poly resistors replaced by ideal C / R
* Vout = Vref (unity feedback), target Vref = 0.4V, Iload max 10mA
***************************************
* Circuit netlist
***************************************
.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom
***************************************
* Circuit parameters
***************************************
.param L_M1=21n N_M1=22
.param L_M2=21n N_M2=N_M1
.param L_M3=21n N_M3=50
.param L_M4=21n N_M4=N_M3
.param L_M5=21n N_M5=64
.param L_M6=21n N_M6=N_M5
.param L_M7=21n N_M7=3
.param L_M8=21n N_M8=N_M7
.param L_M9=21n N_M9=81
.param L_M10=21n N_M10=5115
.param Vb1=0.4164
.param Vb2=0.05
.param R_FB=8782
.param C_FB=0.2
.param C_LOAD=812.3
.PARAM VDD_NOM = 0.8
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.4
.PARAM PARAM_ILOAD =10m
V1 vdd 0 'supply_voltage'
V2 vss 0 0
Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)
***************************************
* Testbenches
***************************************
*    ADM TB
x1 vdd vinp1 Vb2_1 vref_in Vb1_1 vss Vreg1 ldo_folded_cascode_asap7
Vb1 Vb1_1 0 'Vb1'
Vb2 Vb2_1 0 'Vb2'
CL1 Vreg1 0 {C_LOAD*1p}
Iload1 Vreg1 0 'PARAM_ILOAD'
Lfb vinp1 Vreg1 1T
Cfb vinp1 signal_in 1T
.nodeset v(Vreg1)=0.4
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
* NM10: L=0.021um NFIN=5115
let sg_nm10 = 7.2937e-04
* NM1: L=0.021um NFIN=22
let sg_nm1 = 1.1121e-02
* NM2: L=0.021um NFIN=22
let sg_nm2 = 1.1121e-02
* NM4: L=0.021um NFIN=50
let sg_nm4 = 7.3771e-03
* NM3: L=0.021um NFIN=50
let sg_nm3 = 7.3771e-03
* NM9: L=0.021um NFIN=81
let sg_nm9 = 5.7960e-03
* NM6: L=0.021um NFIN=64
let sg_nm6 = 6.5205e-03
* NM5: L=0.021um NFIN=64
let sg_nm5 = 6.5205e-03
* NM7: L=0.021um NFIN=3
let sg_nm7 = 3.0117e-02
* NM8: L=0.021um NFIN=3
let sg_nm8 = 3.0117e-02

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
  alter @n.x1.nm10[delvtrand] = sg_nm10*sgauss(0)
  alter @n.x1.nm1[delvtrand] = sg_nm1*sgauss(0)
  alter @n.x1.nm2[delvtrand] = sg_nm2*sgauss(0)
  alter @n.x1.nm4[delvtrand] = sg_nm4*sgauss(0)
  alter @n.x1.nm3[delvtrand] = sg_nm3*sgauss(0)
  alter @n.x1.nm9[delvtrand] = sg_nm9*sgauss(0)
  alter @n.x1.nm6[delvtrand] = sg_nm6*sgauss(0)
  alter @n.x1.nm5[delvtrand] = sg_nm5*sgauss(0)
  alter @n.x1.nm7[delvtrand] = sg_nm7*sgauss(0)
  alter @n.x1.nm8[delvtrand] = sg_nm8*sgauss(0)

  alter Iload1 dc=10m
  op
  let vout_max = v(Vreg1)
  let iq_max = abs(i(v1))
  echo "MCRES $&run vout_max $&vout_max iq_max $&iq_max"
  ac dec 10 0.1 1G
  meas ac dcgain1 find vdb(Vreg1) at = 0.1
  meas ac ugf1 when vdb(Vreg1)=0
  meas ac pm1 find vp(Vreg1) when vdb(Vreg1)=0
  echo "MCRES $&run dcgain1 $&dcgain1 ugf1 $&ugf1 pm1 $&pm1"

  alter Iload1 dc=10u
  op
  let vout_min = v(Vreg1)
  let iq_min = abs(i(v1))
  echo "MCRES $&run vout_min $&vout_min iq_min $&iq_min"
  ac dec 10 0.1 1G
  meas ac dcgain2 find vdb(Vreg1) at = 0.1
  meas ac ugf2 when vdb(Vreg1)=0
  meas ac pm2 find vp(Vreg1) when vdb(Vreg1)=0
  echo "MCRES $&run dcgain2 $&dcgain2 ugf2 $&ugf2 pm2 $&pm2"
  let run = run + 1
end
.endc

.end
