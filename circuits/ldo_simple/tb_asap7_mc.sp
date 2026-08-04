.title ldo_simple_asap7_tb
* Testbench for ldo_simple (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_simple migrated from sky130 (1.8/2V) to ASAP7 (0.7V)
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
.param L_M1=21n N_M1=11
.param L_M2=21n N_M2=N_M1
.param L_M3=21n N_M3=51
.param L_M4=21n N_M4=N_M3
.param L_M5=21n N_M5=69
.param L_M6=21n N_M6=1896
.param Vb=0.3962
.param R_FB=961.4
.param C_FB=3.369
.param C_LOAD=408.3
.PARAM VDD_NOM = 0.7
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
x1 vdd vinp1 vref_in net1 vss Vreg1 ldo_simple_asap7
Vb net1 0 'Vb'
CL1 Vreg1 0 {C_LOAD*1p}
Iload1 Vreg1 0 'PARAM_ILOAD'
Lfb vinp1 Vreg1 1T
Cfb vinp1 signal_in 1T
Vb2 net2 0 'Vb'
.nodeset v(Vreg1)=0.4
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
* NM1: L=0.021um NFIN=11
let sg_nm1 = 1.5728e-02
* NM2: L=0.021um NFIN=11
let sg_nm2 = 1.5728e-02
* NM3: L=0.021um NFIN=51
let sg_nm3 = 7.3044e-03
* NM4: L=0.021um NFIN=51
let sg_nm4 = 7.3044e-03
* NM5: L=0.021um NFIN=69
let sg_nm5 = 6.2798e-03
* NM6: L=0.021um NFIN=1896
let sg_nm6 = 1.1980e-03

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
  alter @n.x1.nm1[delvtrand] = sg_nm1*sgauss(0)
  alter @n.x1.nm2[delvtrand] = sg_nm2*sgauss(0)
  alter @n.x1.nm3[delvtrand] = sg_nm3*sgauss(0)
  alter @n.x1.nm4[delvtrand] = sg_nm4*sgauss(0)
  alter @n.x1.nm5[delvtrand] = sg_nm5*sgauss(0)
  alter @n.x1.nm6[delvtrand] = sg_nm6*sgauss(0)

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
